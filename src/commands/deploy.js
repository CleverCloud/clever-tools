import colors from 'colors/safe.js';

import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import * as git from '../models/git.js';
import * as Log from '../models/log-v4.js';
import { Logger } from '../logger.js';
import { getAllDeployments } from '@clevercloud/client/cjs/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import * as ExitStrategy from '../models/exit-strategy-option.js';
import * as TmuxManager from '../models/tmux.js';

// Once the API call to redeploy() has been triggered successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network failures)
export async function deploy (params) {
  const { alias, branch: branchName, tag: tagName, quiet, force, follow, 'same-commit-policy': sameCommitPolicy, 'exit-on': exitOnDeploy, 'with-tmux': appsToTmux } = params.options;

  if (appsToTmux) {
    await deployAppsWithTmux(appsToTmux);
    process.exit(0);
  }

  const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

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
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, false, exitStrategy);
      case 'rebuild':
        return restartOnSameCommit(ownerId, appId, commitIdToPush, quiet, true, exitStrategy);
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

async function deployAppsWithTmux (appsList) {
  let appsToDeploy = appsList.split(',');

  if (!appsToDeploy || appsToDeploy.length < 1) {
    Logger.error("You must specify at least one application to deploy with '--with-tmux' option");
    process.exit(1);
  }

  const uniqueApps = Array.from(new Set(appsToDeploy));
  if (uniqueApps.length !== appsToDeploy.length) {
    Logger.error('You have duplicated applications in your list, each will be deployed only once');
    appsToDeploy = uniqueApps;
  }

  Logger.debug(`Applications to deploy: ${appsToDeploy.join(', ')}`);

  const tmux = new TmuxManager.Tmux('clever-tools-multi-deploy');

  if (!tmux.isInstalled) {
    Logger.error("tmux not found, install it to use '--with-tmux' option");
    process.exit(1);
  }

  Logger.println(`${tmux.version} will be used to deploy ${appsToDeploy.join(', ')}`);

  if (tmux.sessionExists()) {
    tmux.killSession();
    Logger.debug('Killed existing tmux session');
  }
  else {
    Logger.debug('No existing tmux session found');
  }

  tmux.createSession();
  Logger.debug(`Created a new tmux session: ${tmux.managedSession}`);

  // We deploy the first app in the first pane and then iterate over the rest of the apps
  deployAppToPane(appsToDeploy[0], 0, tmux);
  for (let i = 1; i < appsToDeploy.length; i++) {
    tmux.createPane();
    deployAppToPane(appsToDeploy[i], i, tmux);
    tmux.setLayout('tiled');
  }

  await tmux.attachSession();
};

function deployAppToPane (app, paneIndex, tmux) {
  const command = `clever deploy -a=${app} || clever restart -a=${app}`;
  tmux.sendCommandToPane(`${paneIndex}`, command);
  Logger.debug(`Created tmux pane ${paneIndex} for ${app}`);
  Logger.debug(`Command sent to pane ${paneIndex}: ${command}`);
};
