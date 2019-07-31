'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');
const colors = require('colors/safe');
const url = require('url');

const Application = require('../models/application.js');
const Event = require('../models/events.js');
const Logger = require('../logger.js');
const WsStream = require('./ws-stream.js');
const { conf } = require('./configuration.js');

const { sendToApi } = require('../models/send-to-api.js');
const { getOldLogs: fetchOldLogs } = require('@clevercloud/client/cjs/api/log.js');

function getWsLogUrl (appId, timestamp, search, deploymentId) {
  const baseUrl = _.template(conf.LOG_WS_URL)({ appId, timestamp });

  const logsUrl = new url.URL(baseUrl);
  if (search != null) {
    logsUrl.searchParams.set('filter', search);
  }
  if (deploymentId != null) {
    logsUrl.searchParams.set('deployment_id', deploymentId);
  }

  return logsUrl.toString();
};

function getAppLogsUrl (appId) {
  return _.template(conf.LOG_HTTP_URL)({ appId });
}

/** Get logs as they arrive from a web socket.
 * Automatically reconnect if the connexion is closed.
 *
 * api: The API object
 * appId: The appId of the application
 * before (Date): only display log lines that happened before this date
 * after  (Date): only display log lines that happened after this date
 * deploymentId: Only display log lines corresponding to this deployment
 */
function getContinuousLogs (api, appId, before, after, search, deploymentId) {
  function makeUrl (retryTimestamp) {
    const newAfter = retryTimestamp === null || after.getTime() > retryTimestamp.getTime() ? after : retryTimestamp;
    return getWsLogUrl(appId, newAfter.toISOString(), search, deploymentId);
  };

  return WsStream
    .openStream(makeUrl, api.session.getAuthorization('GET', getAppLogsUrl(appId), {}))
    .filter((line) => {
      const lineDate = Date.parse(line._source['@timestamp']);
      const isBefore = !before || lineDate < before.getTime();
      const isAfter = !after || lineDate > after.getTime();
      return isBefore && isAfter;
    });
};

function getOldLogs (appId, beforeDate, afterDate, filter, deployment_id) {

  const limit = (beforeDate == null && afterDate == null) ? 300 : null;
  const before = (beforeDate != null) ? beforeDate.toISOString() : null;
  const after = (afterDate != null) ? afterDate.toISOString() : null;

  const logsProm = fetchOldLogs({ appId, limit, before, after, filter, deployment_id }).then(sendToApi);

  return Bacon.fromPromise(logsProm)
    .flatMapLatest((logs) => Bacon.fromArray(logs.reverse()));
};

function isCleverMessage (line) {
  return line._source.syslog_program === '/home/bas/rubydeployer/deployer.rb';
};

function isDeploymentSuccessMessage (line) {
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'successfully deployed in');
};

function isDeploymentFailedMessage (line) {
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'deploy failed in');
};

function isBuildSucessMessage (line) {
  return _.startsWith(line._source['@message'].toLowerCase(), 'build succeeded in');
};

function getAppLogs (api, appId, instances, before, after, search, deploymentId) {
  const now = new Date();
  const fetchOldLogs = !after || after < now;

  const s_newLogs = getNewLogs(api, appId, before, after || now, search, deploymentId);
  const s_logs = fetchOldLogs
    ? getOldLogs(appId, before, after, search, deploymentId).merge(s_newLogs)
    : s_newLogs;

  return s_logs
    .filter((line) => _.isEmpty(instances) || _.includes(instances, line._source['@source_host']))
    .map((line) => {
      const { '@timestamp': timestamp, '@message': message } = line._source;
      if (isDeploymentSuccessMessage(line)) {
        return `${timestamp}: ${colors.bold.green(message)}`;
      }
      else if (isDeploymentFailedMessage(line)) {
        return `${timestamp}: ${colors.bold.red(message)}`;
      }
      else if (isBuildSucessMessage(line)) {
        return `${timestamp}: ${colors.bold.blue(message)}`;
      }
      return `${timestamp}: ${message}`;
    });
};

function getAllLogs (api, push, appData, commitId, quiet) {

  const deploymentId = _.get(push, 'deploymentId');
  const s_deploymentEvents = Event
    .getEvents(api, appData.app_id)
    .filter((e) => {
      if (deploymentId != null) {
        return _.get(e, 'data.uuid') === deploymentId;
      }
      return _.get(e, 'data.commit') === commitId;
    });

  const s_deploymentStart = s_deploymentEvents
    .filter((e) => e.event === 'DEPLOYMENT_ACTION_BEGIN')
    .first()
    .toProperty();

  // We ignore cancellation events triggered by a git push,
  // as they are always generated even though a deployment is not in progress.
  // Since we match events with commit id in a case of a git push,
  // it makes the program stop before the actual deployment.
  const s_deploymentEnd = s_deploymentEvents
    .filter((e) => e.event === 'DEPLOYMENT_ACTION_END')
    .filter((e) => (deploymentId != null) || (e.data.state !== 'CANCELLED') || (e.data.cause !== 'Git'))
    .first()
    .toProperty();

  const s_appLogs = Application.get(api, appData.app_id)
    .flatMapLatest((app) => {
      Logger.debug('Fetch application logs…');
      if (deploymentId != null) {
        return getAppLogs(api, app.id, null, null, new Date(), null, deploymentId);
      }
      return s_deploymentStart.flatMapLatest((deploymentStartEvent) => {
        const deploymentId = deploymentStartEvent.data.uuid;
        return getAppLogs(api, app.id, null, null, new Date(), null, deploymentId);
      });
    });

  // TODO, could be done without a Bus (with merged streams)
  const s_allLogs = new Bacon.Bus();

  s_deploymentStart.onValue(() => {
    s_allLogs.push(colors.bold.blue('Deployment started'));
  });

  s_deploymentEnd.onValue((e) => {
    if (e.data.state === 'OK') {
      s_allLogs.push(colors.bold.green('Deployment successful'));
    }
    else {
      s_allLogs.error('Deployment failed. Please check the logs');
    }
    s_allLogs.end();
  });

  if (!quiet) {
    s_allLogs.push('Fetching application information…');
    s_allLogs.plug(s_appLogs);
  }

  return s_allLogs;
}

module.exports = { getAppLogs, getAllLogs };
