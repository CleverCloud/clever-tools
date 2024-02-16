'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git.js');
const Log = require('../models/log-v4.js');
const Logger = require('../logger.js');
const { getAllDeployments } = require('@clevercloud/client/cjs/api/v2/application.js');
const { sendToApi } = require('../models/send-to-api.js');

// Once the API call to redeploy() has been triggered successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network failures)
async function deploy (params) {
  const { alias, branch: branchName, tag: tagName, quiet, force, follow, 'same-commit-policy': sameCommitPolicy } = params.options;

  const appData = await AppConfig.getAppDetails({ alias });
  const { ownerId, appId } = appData;

  const branchRefspec = await getBranchToDeploy(branchName, tagName);
  const commitIdToPush = await git.getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await git.getRemoteCommit(appData.deployUrl);
  const deployedCommitId = await Application.get(ownerId, appId)
    .then(({ commitId }) => commitId);

  await git.addRemote(appData.alias, appData.deployUrl);

  Logger.println(colors.bold.blue(`Remote application is app_id=${appId}, alias=${appData.alias}, name=${appData.name}`));

  Logger.println(colors.bold.blue(`Remote application belongs to ${ownerId}`));

  if (commitIdToPush === remoteHeadCommitId) {
    switch (sameCommitPolicy) {
      case 'ignore':
        Logger.println(`The clever-cloud application is up-to-date (${colors.green(remoteHeadCommitId)})`);
        return;
      case 'restart':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, follow, false);
      case 'rebuild':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, follow, true);
      case 'error':
      default: {
        const upToDateMessage = `The clever-cloud application is up-to-date (${colors.green(remoteHeadCommitId)}).\nYou can set a policy with 'same-commit-policy' to handle differently when remote HEAD has the same commit as the one to push.\nOr try this command to restart the application:`;
        if (commitIdToPush !== deployedCommitId) {
          const restartWithId = `clever restart --commit ${commitIdToPush}`;
          throw new Error(`${upToDateMessage}\n${colors.yellow(restartWithId)}`);
        }
        throw new Error(`${upToDateMessage}\n${colors.yellow('clever restart')}`);
      }
    }
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

  await git.push(appData.deployUrl, commitIdToPush, force)
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

async function restartOnSameCommit (ownerId, appId, commitIdToPush, quiet, follow, withoutCache) {
  const restart = await Application.redeploy(ownerId, appId, commitIdToPush, withoutCache);
  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, deploymentId: restart.deploymentId, quiet, follow });
}

async function getBranchToDeploy (branchName, tagName) {
  if (tagName) {
    const useTag = await git.isExistingTag(tagName);
    if (useTag) {
      const tagRefspec = await git.getFullBranch(tagName);
      return tagRefspec;
    }
    else {
      throw new Error(`Tag ${tagName} doesn't exist locally`);
    }
  }
  else {
    return await git.getFullBranch(branchName);
  }
}

module.exports = { deploy };
