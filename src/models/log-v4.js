const { getHostAndTokens, processError } = require('./send-to-api.js');
const colors = require('colors/safe');
const { Deferred } = require('./utils.js');
const Logger = require('../logger.js');
const { waitForDeploymentEnd, waitForDeploymentStart } = require('./deployments.js');
const { ApplicationLogStream } = require('@clevercloud/client/cjs/streams/application-logs.js');

// 2000 logs per 100ms maximum
const THROTTLE_ELEMENTS = 2000;
const THROTTLE_PER_IN_MILLISECONDS = 100;

const retryConfiguration = {
  enabled: true,
  maxRetryCount: 6,
};

async function displayLogs (params) {

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
    .on('open', (event) => {
      Logger.debug(colors.blue(`Logs stream (open) ${JSON.stringify({ appId, filter, deploymentId })}`));
      if (format === 'json') {
        jsonArray.open();
      }
    })
    .on('error', (event) => {
      Logger.debug(colors.red(`Logs stream (error) ${event.error.message}`));
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
          Logger.println(formatLogLine(log));
      }
    });

  // start() is blocking until end of stream
  logStream.start()
    .then((reason) => {
      if (format === 'json') {
        jsonArray.close();
      }
      return deferred.resolve();
    })
    .catch(processError)
    .catch((error) => deferred.reject(error));

  return logStream;
}

async function watchDeploymentAndDisplayLogs (options) {

  const {
    ownerId,
    appId,
    deploymentId,
    commitId,
    knownDeployments,
    quiet,
    follow,
    redeployDate,
  } = options;

  Logger.println('Waiting for deployment to start…');
  const deployment = await waitForDeploymentStart({ ownerId, appId, deploymentId, commitId, knownDeployments });
  Logger.println(colors.bold.blue(`Deployment started (${deployment.uuid})`));

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

  Logger.println('Waiting for application logs…');

  // Wait for deployment end (or an error thrown by logs with the deferred)
  const deploymentEnded = await Promise.race([
    waitForDeploymentEnd({ ownerId, appId, deploymentId: deployment.uuid }),
    deferred.promise,
  ]);

  if (!quiet && !follow) {
    logsStream.close(quiet ? 'quiet' : 'follow');
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

function formatLogLine (log) {
  const { date, message } = log;
  if (isDeploymentSuccessMessage(log)) {
    return `${date.toISOString()}: ${colors.bold.green(message)}`;
  }
  else if (isDeploymentFailedMessage(log)) {
    return `${date.toISOString()}: ${colors.bold.red(message)}`;
  }
  else if (isBuildSucessMessage(log)) {
    return `${date.toISOString()}: ${colors.bold.blue(message)}`;
  }
  return `${date.toISOString()}: ${message}`;
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

module.exports = { displayLogs, watchDeploymentAndDisplayLogs };

/**
 * Helper to print a real JSON array with starting `[` and ending `]`
 */
class JsonArray {
  constructor () {
    this._isFirst = true;
  }

  open () {
    process.stdout.write('[\n');
  }

  push (log) {
    if (this._isFirst) {
      this._isFirst = false;
    }
    else {
      process.stdout.write(',\n');
    }
    process.stdout.write(`  ${JSON.stringify(log)}`);
  }

  close () {
    process.stdout.write('\n]');
  }
}
