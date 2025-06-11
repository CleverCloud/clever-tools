import { styleText } from 'node:util';
import dedent from 'dedent';

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
        Logger.printSuccess(`The application is up-to-date (${styleText('grey', remoteHeadCommitId)})`);
        return;
      case 'restart':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, false, exitStrategy);
      case 'rebuild':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, true, exitStrategy);
      case 'error':
      default: {
        const restartCommand = commitIdToPush !== deployedCommitId ? `clever restart --commit ${commitIdToPush}` : 'clever restart';
        throw new Error(dedent`
          Remote HEAD has the same commit as the one to push ${styleText('grey', `(${remoteHeadCommitId})`)}, your application is up-to-date.
          Create a new commit, use ${styleText('blue', restartCommand)} or the ${styleText('blue', '--same-commit-policy')} option.
        `);
      }
    }
  }

  // It's sometimes tricky to figure out the deployment ID for the current git push.
  // We on have the commit ID but there in a situation where the last deployment was cancelled, it may have the same commit ID.
  // So before pushing, we get the last deployments so we can after the push figure out which deployment is new…
  const knownDeployments = await getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);

  Logger.println(dedent`
    ${styleText('bold', `🚀 Deploying ${styleText('green', appData.name)}`)}
       Application ID  ${styleText('grey', `${appId}`)}
       Org ID          ${styleText('grey', `${ownerId}`)}
  `);

  Logger.println();

  Logger.println(styleText('bold', '🔀 Git information'));
  if (remoteHeadCommitId == null || deployedCommitId == null) {
    Logger.println(`   ${styleText('yellow', '!')} App is brand new, no commits on remote yet`);
  }
  else {
    Logger.println(`   Remote head     ${styleText('yellow', remoteHeadCommitId)} (${branchRefspec})`);
    Logger.println(`   Deployed commit ${styleText('yellow', deployedCommitId)}`);
  }
  Logger.println(`   Local commit    ${styleText('yellow', commitIdToPush)} ${styleText('blue', '[will be deployed]')}`);

  Logger.println();

  Logger.println(dedent`
    ${styleText('bold', '🔄 Deployment progress')}
       ${styleText('blue', '→ Pushing source code to Clever Cloud…')}
  `);

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

  await Logger.println(`   ${styleText('green', '✓ Code pushed to Clever Cloud')}`);

  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, commitId: commitIdToPush, knownDeployments, quiet, exitStrategy });
}

async function restartOnSameCommit (ownerId, appId, commitIdToPush, quiet, withoutCache, exitStrategy) {
  const cacheSuffix = withoutCache ? ' without using cache' : '';
  Logger.println(`🔄 Restarting ${styleText('bold', appId)}${cacheSuffix} ${styleText('grey', `(${commitIdToPush})`)}`);

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
