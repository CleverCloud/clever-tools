'use strict';

const path = require('path');

const _ = require('lodash');
const Bacon = require('baconjs');
const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const Event = require('../models/events.js');
const Git = require('../models/git.js')(path.resolve('.'));
const Log = require('../models/log.js');
const Logger = require('../logger.js');

const timeout = 5 * 60 * 1000;

function deploy (api, params) {
  const { alias, branch: branchName, quiet, force } = params.options;

  const s_appData = AppConfig.getAppData(alias).toProperty();
  const s_branchRefspec = Git.getBranch(branchName)
    .map((branch) => branch.name())
    .toProperty();

  const s_remote = s_appData
    .flatMapLatest(({ alias, deploy_url }) => Git.createRemote(alias, deploy_url))
    .flatMapLatest((remote) => Git.keepFetching(timeout, remote))
    .toProperty();

  const s_commitIdToPush = Git.getCommitId(branchName).toProperty();
  const s_remoteHeadCommitId = s_remote
    .map((remote) => Git.getRemoteName(remote))
    .flatMapLatest((remoteName) => Git.getRemoteCommitId(remoteName))
    .toProperty();
  const s_deployedCommitId = s_appData
    .flatMapLatest(({ app_id, app_orga }) => Application.get(api, app_id, app_orga))
    .flatMapLatest(({ commitId }) => commitId)
    .toProperty();

  const s_allLogs = Bacon.combineAsArray(s_commitIdToPush, s_remoteHeadCommitId, s_deployedCommitId)
    .flatMapLatest(([commitIdToPush, remoteCommitId, deployedCommitId]) => {
      if (commitIdToPush === remoteCommitId) {
        const upToDateMessage = `The clever-cloud application is up-to-date. Try this command to restart the application:`;
        if (commitIdToPush !== deployedCommitId) {
          return new Bacon.Error(`${upToDateMessage}\nclever restart --commit ${commitIdToPush}`);
        }
        return new Bacon.Error(`${upToDateMessage}\nclever restart`);
      }
      return Bacon.combineAsArray(s_remote, s_branchRefspec);
    })
    .flatMapLatest(([remote, branchRefspec]) => {
      Logger.println('Pushing source code to Clever Cloud.');
      const s_push = Git.push(remote, branchRefspec, force);
      return Bacon.combineAsArray(s_push, s_appData, s_commitIdToPush);
    })
    .flatMapLatest(([push, appData, commitId]) => {
      Logger.println('Your source code has been pushed to Clever Cloud.');
      return getAllLogs(api, push, appData, commitId, quiet);
    });

  s_allLogs.onValue(Logger.println);
  s_allLogs.onError(handleError);
};

function restart (api, params) {
  const { alias, quiet, commit, 'without-cache': withoutCache } = params.options;

  const s_appData = AppConfig.getAppData(alias).toProperty();
  const s_CommitIdToRestart = Git.resolveFullCommitId(commit).toProperty();
  const s_remoteCommitId = s_appData
    .flatMapLatest(({ app_id, app_orga }) => Application.get(api, app_id, app_orga))
    .flatMapLatest(({ commitId }) => commitId)
    .toProperty();

  const s_allLogs = Bacon
    .combineAsArray(s_appData, s_CommitIdToRestart, s_remoteCommitId)
    .flatMapLatest(([appData, fullCommitId, remoteCommitId]) => {
      let suffix = ' on commit #' + (fullCommitId || remoteCommitId);
      if (withoutCache) suffix += ' without using cache';
      Logger.println('Restarting ' + appData.name + suffix);
      const s_redeploy = Application.redeploy(api, appData.app_id, appData.org_id, fullCommitId, withoutCache);
      return Bacon.combineAsArray(s_redeploy, appData, remoteCommitId);
    })
    .flatMapLatest(([redeploy, appData, remoteCommitId]) => {
      return getAllLogs(api, redeploy, appData, remoteCommitId, quiet);
    });

  s_allLogs.onValue(Logger.println);
  s_allLogs.onError(handleError);
};

function handleError (error) {
  Logger.error(_.get(error, 'message', error));
  process.exit(1);
}

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
        return Log.getAppLogs(api, app.id, null, null, new Date(), null, deploymentId);
      }
      return s_deploymentStart.flatMapLatest((deploymentStartEvent) => {
        const deploymentId = deploymentStartEvent.data.uuid;
        return Log.getAppLogs(api, app.id, null, null, new Date(), null, deploymentId);
      });
    });

  // TODO, could be done without a Bus (with merged streams)
  const s_allLogs = new Bacon.Bus();

  s_deploymentStart.onValue((e) => {
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

module.exports = { deploy, restart };
