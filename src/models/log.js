import _ from 'lodash';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { Deferred } from './utils.js';
import { getOldLogs } from '@clevercloud/client/cjs/api/v2/log.js';
import { LogsStream } from '@clevercloud/client/cjs/streams/logs.node.js';
import { sendToApi, getHostAndTokens } from './send-to-api.js';
import { waitForDeploymentEnd, waitForDeploymentStart } from './deployments.js';
import * as ExitStrategy from '../models/exit-strategy-option.js';

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
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'build succeeded in');
};

function formatLogLine (line) {
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
}

async function displayLiveLogs ({ appId, filter, until, deploymentId }, deferred) {

  const { apiHost, tokens } = await getHostAndTokens();
  const logsStream = new LogsStream({ apiHost, tokens, appId, filter, deploymentId });

  logsStream
    .on('open', () => Logger.debug('SSE for logs (open) ' + JSON.stringify({ appId, filter, deploymentId })))
    .on('log', (line) => {
      const { '@timestamp': timestamp } = line._source;
      if (until != null && new Date(timestamp) > until) {
        logsStream.close();
      }
      else {
        Logger.println(formatLogLine(line));
      }
    })
    .on('ping', () => Logger.debug('SSE for logs (ping)'))
    .on('close', ({ reason }) => Logger.debug('SSE for logs (close) ' + reason))
    .on('error', (error) => deferred.reject(error));

  logsStream.open({ autoRetry: true, maxRetryCount: 6 });

  return logsStream;
}

export async function displayLogs ({ appAddonId, until, since, filter, deploymentId }) {

  const now = new Date();

  const fetchOldLogs = (since == null || since < now);
  if (fetchOldLogs) {

    const oldLogs = await getOldLogs({
      appId: appAddonId,
      before: until != null ? until.toISOString() : null,
      after: since != null ? since.toISOString() : null,
      filter,
      deployment_id: deploymentId,
    }).then(sendToApi);

    for (const line of oldLogs.reverse()) {
      Logger.println(formatLogLine(line));
    }
  }

  // No need to fetch live logs if until date is in the past
  if (until != null && until < now) {
    return;
  }

  const deferred = new Deferred();

  await displayLiveLogs({ appId: appAddonId, filter, deploymentId, until }, deferred);

  return deferred.promise;
}

export async function watchDeploymentAndDisplayLogs ({ ownerId, appId, deploymentId, commitId, knownDeployments, quiet, exitStrategy }) {

  ExitStrategy.plotQuietWarning(exitStrategy, quiet);
  // If in quiet mode, we only log start/finished deployment messages
  Logger.println('Waiting for deployment to start…');
  const deployment = await waitForDeploymentStart({ ownerId, appId, deploymentId, commitId, knownDeployments });
  Logger.println(colors.bold.blue(`Deployment started (${deployment.uuid})`));

  if (exitStrategy === 'deploy-start') {
    return;
  }

  const deferred = new Deferred();
  let logsStream;

  if (!quiet) {
    // About the deferred…
    // If displayLiveLogs() throws an error,
    // the async function we're in (watchDeploymentAndDisplayLogs) will stop here and the error will be passed to the parent.
    // displayLiveLogs() defines callback listeners so if it catches error in those callbacks,
    // it has no proper way to bubble up the error here.
    // Using the deferred enables this.
    logsStream = await displayLiveLogs({ appId, deploymentId: deployment.uuid }, deferred);
  }

  Logger.println('Waiting for application logs…');

  // Wait for deployment end (or an error thrown by logs with the deferred)
  const deploymentEnded = await Promise.race([
    waitForDeploymentEnd({ ownerId, appId, deploymentId: deployment.uuid }),
    deferred.promise,
  ]);

  if (!quiet && exitStrategy !== 'never') {
    logsStream.close();
  }

  if (deploymentEnded.state === 'OK') {
    Logger.println(colors.bold.green('Deployment successful'));
  }
  else if (deploymentEnded.state === 'CANCELLED') {
    throw new Error('Deployment was cancelled. Please check the activity');
  }
  else {
    throw new Error('Deployment failed. Please check the logs');
  }
}
