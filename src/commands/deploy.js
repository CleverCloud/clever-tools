import colors from 'colors/safe.js';

import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import * as git from '../models/git.js';
import * as Log from '../models/log-v4.js';
import { Logger } from '../logger.js';
import { getAllDeployments } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import * as ExitStrategy from '../models/exit-strategy-option.js';

// Once the API call to redeploy() has been triggered successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network failures)
export async function deploy (params) {
  const { alias, branch: branchName, tag: tagName, quiet, force, follow, 'same-commit-policy': sameCommitPolicy, 'exit-on': exitOnDeploy } = params.options;

  const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

  const appData = await AppConfig.getAppDetails({ alias });
  const { ownerId, appId } = appData;

  const branchRefspec = await getBranchToDeploy(branchName, tagName);
  const commitIdToPush = await git.getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await git.getRemoteCommit(appData.deployUrl);
  const deployedCommitId = await Application.get(ownerId, appId)
    .then(({ commitId }) => commitId);

  await git.addRemote(appData.alias, appData.deployUrl);

  if (commitIdToPush === remoteHeadCommitId) {
    switch (sameCommitPolicy) {
      case 'ignore':
        Logger.println(`The clever-cloud application is up-to-date (${colors.green(remoteHeadCommitId)})`);
        return;
      case 'restart':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, false, exitStrategy);
      case 'rebuild':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, true, exitStrategy);
      case 'error':
      default: {
        const restartCommand = commitIdToPush !== deployedCommitId ? `clever restart --commit ${commitIdToPush}` : 'clever restart';
        const upToDateMessage = `Remote HEAD has the same commit as the one to push ${colors.grey(`(${remoteHeadCommitId})`)}, your application is up-to-date.\nCreate a new commit, use ${colors.blue(restartCommand)} or the ${colors.blue('--same-commit-policy')} option.`;
        throw new Error(upToDateMessage);
      }
    }
  }

  // It's sometimes tricky to figure out the deployment ID for the current git push.
  // We on have the commit ID but there in a situation where the last deployment was cancelled, it may have the same commit ID.
  // So before pushing, we get the last deployments so we can after the push figure out which deployment is new…
  const knownDeployments = await getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);

  await pushAndDisplay(appData.name, appData.deployUrl, ownerId, appId, remoteHeadCommitId, deployedCommitId, commitIdToPush, branchRefspec, force);

  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, commitId: commitIdToPush, knownDeployments, quiet, exitStrategy });
}

async function restartOnSameCommit (ownerId, appId, commitIdToPush, quiet, withoutCache, exitStrategy) {
  const restart = await Application.redeploy(ownerId, appId, commitIdToPush, withoutCache);
  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, deploymentId: restart.deploymentId, quiet, exitStrategy });
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

/**
 * Push the code to Clever Cloud and display the progress
 * @param {string} name
 * @param {string} deployUrl
 * @param {string} ownerId
 * @param {string} appId
 * @param {string} remoteHeadCommitId
 * @param {string} deployedCommitId
 * @param {string} commitIdToPush
 * @param {string} branchRefspec
 * @param {boolean} force
 * @returns {Promise<void>}
 * @throws {Error} if the push fails
 * @private
 */
async function pushAndDisplay (name, deployUrl, ownerId, appId, remoteHeadCommitId, deployedCommitId, commitIdToPush, branchRefspec, force) {

  Logger.println(`${colors.blue('')}${colors.bold(`🚀 Deploying ${colors.green(name)}`)}`);
  Logger.println(`   Application ID  ${colors.gray(`${appId}`)}`);
  Logger.println(`   Organization ID ${colors.gray(`${ownerId}`)}`);
  Logger.println();

  Logger.println(colors.bold('🔀 Git information'));
  if (remoteHeadCommitId == null || deployedCommitId == null) {
    Logger.println(`   ${colors.yellow('!')} App is brand new, no commits on remote yet`);
  }
  else {
    Logger.println(`   Remote head     ${colors.yellow(remoteHeadCommitId)} (${branchRefspec})`);
    Logger.println(`   Deployed commit ${colors.yellow(deployedCommitId)}`);
  }
  Logger.println(`   Local commit    ${colors.yellow(commitIdToPush)} ${colors.blue('[will be deployed]')}`);
  Logger.println();

  Logger.println(colors.bold('🔄 Deployment progress'));
  Logger.println(`   ${colors.blue('→ Pushing source code to Clever Cloud…')}`);

  await git.push(deployUrl, commitIdToPush, force)
    .catch(async (e) => {
      const isShallow = await git.isShallow();
      if (isShallow) {
        throw new Error('Failed to push your source code because your repository is shallow and therefore cannot be pushed to the Clever Cloud remote.');
      }
      else {
        throw e;
      }
    });

  Logger.println(`   ${colors.green('✓ Code pushed to Clever Cloud')}`);
}
