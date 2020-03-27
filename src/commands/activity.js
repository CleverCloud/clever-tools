'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');
const colors = require('colors/safe');
const moment = require('moment');

const Activity = require('../models/activity.js');
const AppConfig = require('../models/app_configuration.js');
const Event = require('../models/events.js');
const formatTable = require('../format-table');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

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
  'IN PROGRESS',
  'downscale',
  // a git commit id is 40 chars long
  40,
  0,
]);

function formatActivityLine (event) {
  return formatActivityTable([
    [
      moment(event.date).format(),
      getColoredState(event.state, event.isLast),
      event.action,
      event.commit || 'not specified',
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
    process.stdout.clearLine();
  }
}

function activity (params) {
  const { alias, 'show-all': showAll, follow } = params.options;

  const s_activity = Bacon.fromPromise(AppConfig.getAppDetails({ alias }))
    .flatMapLatest(({ ownerId, appId }) => {

      const s_oldActivity = Bacon.fromPromise(Activity.list(ownerId, appId, showAll))
        .flatMapLatest((events) => {
          const reversedArrayWithIndex = events
            .reverse()
            .map((event, index, all) => {
              const isLast = index === all.length - 1;
              return ({ ...event, isLast });
            });
          return Bacon.fromArray(reversedArrayWithIndex);
        });

      if (!follow) {
        return s_oldActivity;
      }

      const s_newActivity = Event.getEvents(appId)
        .filter(({ event }) => {
          return event === 'DEPLOYMENT_ACTION_BEGIN'
            || event === 'DEPLOYMENT_ACTION_END';
        })
        .map(({ date, data: { state, action, commit, cause } }) => {
          return { date, state, action, commit, cause, isLast: true };
        })
        .skipDuplicates(_.isEqual);

      return s_oldActivity.merge(s_newActivity);
    })
    .scan({}, (previousEvent, event) => {
      if (isTemporaryEvent(previousEvent)) {
        clearPreviousLine();
      }

      const activityLine = formatActivityLine(event);
      Logger.println(activityLine);

      return event;
    });

  handleCommandStream(s_activity);
}

module.exports = activity;
