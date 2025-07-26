import { getHostAndTokens, processError } from './send-to-api.js';
import { styleText } from 'node:util';
import { Deferred } from './utils.js';
import { Logger } from '../logger.js';
import { waitForDeploymentEnd, waitForDeploymentStart } from './deployments.js';
import { ApplicationLogStream } from '@clevercloud/client/esm/streams/application-logs.js';
import { JsonArray } from './json-array.js';
import * as ExitStrategy from "./exit-strategy-option.js";
import { getBest } from './domain.js';
import { conf } from './configuration.js';

const RESET_COLOR = '\x1B[0m';

// 2000 logs per 100ms maximum
const THROTTLE_ELEMENTS = 2000;
const THROTTLE_PER_IN_MILLISECONDS = 100;

const retryConfiguration = {
  enabled: true,
  maxRetryCount: 6,
};

export async function displayLogs (params) {

  const deferred = params.deferred || new Deferred();
  const { apiHost, tokens } = await getHostAndTokens();
  const { ownerId, appId, filter, since, until, deploymentId, format } = params;

  if (format === 'json' && until == null) {
    throw new Error('"json" format is only applicable with a limiting parameter such as `--until`');
  }

  const logStream = new ApplicationLogStream({
    apiHost,
    tokens,
    ownerId,
    appId,
    connectionTimeout: 10_000,
    retryConfiguration,
    since,
    until,
    deploymentId,
    filter,
    throttleElements: THROTTLE_ELEMENTS,
    throttlePerInMilliseconds: THROTTLE_PER_IN_MILLISECONDS,
  });

  // Properly close the stream
  process.once('SIGINT', (signal) => logStream.close(signal));
  const jsonArray = new JsonArray();

  logStream
    .on('open', () => {
      Logger.debug(styleText('blue', `Logs stream (open) ${JSON.stringify({ appId, filter, deploymentId })}`));
      if (format === 'json') {
        jsonArray.open();
      }
    })
    .on('error', (event) => {
      Logger.debug(styleText('red', `Logs stream (error) ${event.error.message}`));
    })
    .onLog((log) => {
      switch (format) {
        case 'json':
          jsonArray.push(log);
          return;
        case 'json-stream':
          Logger.printJson(log);
          return;
        case 'human':
        default:
          if (log.message === RESET_COLOR) {return;}
          Logger.println(formatLogLine(log));
      }
    });

  // start() is blocking until end of stream
  logStream.start()
    .then(() => {
      if (format === 'json') {
        jsonArray.close();
      }
      return deferred.resolve();
    })
    .catch(processError)
    .catch((error) => deferred.reject(error));

  return logStream;
}

export async function watchDeploymentAndDisplayLogs (options) {

  const {
    ownerId,
    appId,
    deploymentId,
    commitId,
    knownDeployments,
    quiet,
    redeployDate,
    exitStrategy,
  } = options;

  ExitStrategy.plotQuietWarning(exitStrategy, quiet);
  // If in quiet mode, we only log start/finished deployment messages
  if (!quiet) {
    Logger.println(`   ${styleText('blue', '→ Waiting for deployment to start…')}`);
  }
  const deployment = await waitForDeploymentStart({ ownerId, appId, deploymentId, commitId, knownDeployments });
  Logger.println(`   ${styleText('green', `✓ Deployment started ${styleText('grey', `(${deployment.uuid})`)}`)}`);

  if (exitStrategy === 'deploy-start') {
    return;
  }

  const deferred = new Deferred();
  let logsStream;

  if (!quiet) {
    // About the deferred…
    // If displayLogs() throws an error,
    // the async function we're in (watchDeploymentAndDisplayLogs) will stop here and the error will be passed to the parent.
    // displayLogs() defines callback listeners so if it catches error in those callbacks,
    // it has no proper way to bubble up the error here.
    // Using the deferred enables this.
    logsStream = await displayLogs({ ownerId, appId, deploymentId: deployment.uuid, since: redeployDate, deferred });
  }

  if (!quiet) {
    Logger.println(`   ${styleText('blue', '→ Waiting for application logs…')}`);
  }

  // Wait for deployment end (or an error thrown by logs with the deferred)
  const deploymentEnded = await Promise.race([
    waitForDeploymentEnd({ ownerId, appId, deploymentId: deployment.uuid }),
    deferred.promise,
  ]);

  if (!quiet && exitStrategy !== 'never') {
    logsStream.close(quiet ? 'quiet' : 'follow');
  }

  if (deploymentEnded.state === 'OK') {
    const favouriteDomain = await getBest(appId, ownerId);
    Logger.println('');
    Logger.println(`${styleText(['bold', 'green'], '✓ Access your application:')} ${styleText(['underline', 'bold'], `https://${favouriteDomain.fqdn}`)}`);
    Logger.println(`${styleText(['bold', 'blue'], '→ Manage your application:')} ${styleText(['underline', 'bold'], `${conf.GOTO_URL}/${appId}`)}`);
  }
  else if (deploymentEnded.state === 'CANCELLED') {
    throw new Error('Deployment was cancelled. Please check the activity');
  }
  else {
    throw new Error('Deployment failed. Please check the logs');
  }
}

function formatLogLine (log) {
  const { date, message } = log;
  if (isDeploymentSuccessMessage(log)) {
    return `${date.toISOString()}: ${styleText(['bold', 'green'], message)}`;
  }
  else if (isDeploymentFailedMessage(log)) {
    return `${date.toISOString()}: ${styleText(['bold', 'red'], message)}`;
  }
  else if (isBuildSucessMessage(log)) {
    return `${date.toISOString()}: ${styleText(['bold', 'blue'], message)}`;
  }
  return `${date.toISOString()}: ${message}${RESET_COLOR}`;
}

function isCleverMessage (log) {
  return log.service !== 'bas-deploy.service';
};

function isDeploymentSuccessMessage (log) {
  return isCleverMessage(log) && log.message.toLowerCase().startsWith('successfully deployed in');
};

function isDeploymentFailedMessage (log) {
  return isCleverMessage(log) && log.message.toLowerCase().startsWith('deploy failed in');
};

function isBuildSucessMessage (log) {
  return isCleverMessage(log) && log.message.toLowerCase().startsWith('build succeeded in');
};
