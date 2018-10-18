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

function getColoredState (state, isNew) {
  if (state === 'OK') {
    return colors.bold.green(state);
  }
  if (state === 'FAIL' || state === 'CANCELLED') {
    return colors.bold.red(state);
  }
  if (state === 'WIP' && !isNew) {
    return colors.bold.red('FAIL');
  }
  if (state === 'WIP' && isNew) {
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
      getColoredState(event.state, event.isNew),
      event.action,
      event.commit || 'not specified',
      event.cause,
    ],
  ]);
};

function isTemporaryEvent (ev) {
  return (ev.state === 'WIP' && ev.isNew) || ev.state === 'CANCELLED';
}

function clearPreviousLine () {
  process.stdout.moveCursor(0, -1);
  process.stdout.cursorTo(0);
  process.stdout.clearLine();
}

function activity (api, params) {
  const { alias, 'show-all': showAll, follow } = params.options;

  const s_activity = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {

      const s_oldActivity = Activity.list(api, appData.app_id, appData.org_id, showAll)
        .flatMapLatest((events) => Bacon.fromArray(_.reverse(events)));

      if (!follow) {
        return s_oldActivity;
      }

      const s_newActivity = Event.getEvents(api, appData.app_id)
        .filter(({ event }) => {
          return event === 'DEPLOYMENT_ACTION_BEGIN'
            || event === 'DEPLOYMENT_ACTION_END';
        })
        .map(({ date, data: { state, action, commit, cause } }) => {
          return { date, state, action, commit, cause, isNew: true };
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
