'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git.js');
const Log = require('../models/log.js');
const Logger = require('../logger.js');
const { getAllDeployments } = require('@clevercloud/client/cjs/api/application.js');
const { sendToApi } = require('../models/send-to-api.js');

// Once the API call to redeploy() has been triggered successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network failures)
async function deploy (params) {
  const { alias, branch: branchName, quiet, force, follow } = params.options;

  const appData = await AppConfig.getAppDetails({ alias });
  const { ownerId, appId } = appData;
  const branchRefspec = await git.getFullBranch(branchName);

  const commitIdToPush = await git.getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await git.getRemoteCommit(appData.deployUrl);
  const deployedCommitId = await Application.get(ownerId, appId)
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

  // It's sometimes tricky to figure out the deployment ID for the current git push.
  // We on have the commit ID but there in a situation where the last deployment was cancelled, it may have the same commit ID.
  // So before pushing, we get the last deployments so we can after the push figure out which deployment is new…
  const knownDeployments = await getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);

  Logger.println('Pushing source code to Clever Cloud…');
  await git.push(appData.deployUrl, branchRefspec, force)
    .catch(async (e) => {
      const isShallow = await git.isShallow();
      if (isShallow) {
        throw new Error('Failed to push your source code because your repository is shallow and therefore cannot be pushed to the Clever Cloud remote.');
      }
      else {
        throw e;
      }
    });
  Logger.println(colors.bold.green('Your source code has been pushed to Clever Cloud.'));

  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, commitId: commitIdToPush, knownDeployments, quiet, follow });
}

module.exports = { deploy };
