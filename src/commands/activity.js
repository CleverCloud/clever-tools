'use strict';

const colors = require('colors/safe');
const moment = require('moment');

const Activity = require('../models/activity.js');
const AppConfig = require('../models/app_configuration.js');
const formatTable = require('../format-table');
const Logger = require('../logger.js');
const { Deferred } = require('../models/utils.js');
const { EventsStream } = require('@clevercloud/client/cjs/streams/events.node.js');
const { getHostAndTokens } = require('../models/send-to-api.js');

function getColoredState (state, isLast) {
  if (state === 'OK') {
    return colors.bold.green(state);
  }
  if (state === 'FAIL' || state === 'CANCELLED') {
    return colors.bold.red(state);
  }
  if (state === 'WIP' && !isLast) {
    return colors.bold.red('FAIL');
  }
  if (state === 'WIP' && isLast) {
    return colors.bold.blue('IN PROGRESS');
  }
  Logger.warn(`Unknown deployment state: ${state}`);
  return 'UNKNOWN';
}

// We use examples of maximum width text to have a clean display
const formatActivityTable = formatTable([
  moment().format(),
  47,
  'IN PROGRESS',
  'downscale',
  // a git commit id is 8 chars long
  8,
  0,
]);

function formatActivityLine (event) {
  return formatActivityTable([
    [
      moment(event.date).format(),
      event.uuid,
      getColoredState(event.state, event.isLast),
      event.action,
      event?.commit?.substring(0, 8) ?? 'N/A',
      event.cause,
    ],
  ]);
};

function isTemporaryEvent (ev) {
  if (ev == null) {
    return false;
  }
  return (ev.state === 'WIP' && ev.isLast) || ev.state === 'CANCELLED';
}

function clearPreviousLine () {
  if (process.stdout.isTTY) {
    process.stdout.moveCursor(0, -1);
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }
}

function handleEvent (previousEvent, event) {
  if (isTemporaryEvent(previousEvent)) {
    clearPreviousLine();
  }

  const activityLine = formatActivityLine(event);
  Logger.println(activityLine);

  return event;
}

function onEvent (previousEvent, newEvent) {
  const { event, date, data: { uuid, state, action, commit, cause } } = newEvent;
  if (event !== 'DEPLOYMENT_ACTION_BEGIN' && event !== 'DEPLOYMENT_ACTION_END') {
    return previousEvent;
  }
  return handleEvent(previousEvent, { date, uuid, state, action, commit, cause, isLast: true });
}

async function activity (params) {
  const { alias, 'show-all': showAll, follow } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const events = await Activity.list(ownerId, appId, showAll);
  const reversedArrayWithIndex = events
    .reverse()
    .map((event, index, all) => {
      const isLast = index === all.length - 1;
      return ({ ...event, isLast });
    });
  let lastEvent = reversedArrayWithIndex.reduce(handleEvent, {});

  if (!follow) {
    return lastEvent;
  }

  const { apiHost, tokens } = await getHostAndTokens();
  const eventsStream = new EventsStream({ apiHost, tokens, appId });

  const deferred = new Deferred();

  eventsStream
    .on('open', () => Logger.debug('WS for events (open) ' + JSON.stringify({ appId })))
    .on('event', (event) => {
      lastEvent = onEvent(lastEvent, event);
      return lastEvent;
    })
    .on('ping', () => Logger.debug('WS for events (ping)'))
    .on('close', ({ reason }) => Logger.debug('WS for events (close) ' + reason))
    .on('error', deferred.reject);

  eventsStream.open({ autoRetry: true, maxRetryCount: 6 });

  return deferred.promise;
}

module.exports = { activity };
