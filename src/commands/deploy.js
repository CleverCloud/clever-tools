'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

async function deploy (params) {
  const { alias, branch: branchName, quiet, force } = params.options;

  const appData = await AppConfig.getAppDetails({ alias });
  const branchRefspec = await git.getFullBranch(branchName);

  const commitIdToPush = await git.getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await git.getRemoteCommit(appData.deployUrl);
  const deployedCommitId = await Application.get(appData.ownerId, appData.appId)
    .then(({ commitId }) => commitId);

  await git.addRemote(appData.alias, appData.deployUrl);

  if (commitIdToPush === remoteHeadCommitId) {
    const upToDateMessage = `The clever-cloud application is up-to-date (${remoteHeadCommitId}). Try this command to restart the application:`;
    if (commitIdToPush !== deployedCommitId) {
      throw new Error(`${upToDateMessage}\nclever restart --commit ${commitIdToPush}`);
    }
    throw new Error(`${upToDateMessage}\nclever restart`);
  }

  if (remoteHeadCommitId == null || deployedCommitId == null) {
    Logger.println('App is brand new, no commits on remote yet');
  }
  else {
    Logger.println(`Remote git head commit   is ${colors.green(remoteHeadCommitId)}`);
    Logger.println(`Current deployed commit  is ${colors.green(deployedCommitId)}`);
  }
  Logger.println(`New local commit to push is ${colors.green(commitIdToPush)} (from ${colors.green(branchRefspec)})`);
  const push = await git.push(appData.deployUrl, branchRefspec, force);

  Logger.println('Your source code has been pushed to Clever Cloud.');

  const s_logs = await Log.getAllLogs(push, appData, commitIdToPush, quiet);
  s_logs.onValue(Logger.println);
  return s_logs.toPromise();
}

module.exports = { deploy };
