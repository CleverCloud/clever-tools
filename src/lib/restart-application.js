import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import * as ExitStrategy from '../models/exit-strategy-option.js';
import { Git } from '../models/git.js';
import * as Log from '../models/log.js';
import { styleText } from './style-text.js';

/**
 * Restart an application, then follow its deployment logs
 * @param {object} options
 * @param {string} [options.alias]
 * @param {{ app_id: string } | { app_name: string }} [options.app]
 * @param {boolean} options.quiet
 * @param {string} [options.commit]
 * @param {boolean} options.withoutCache
 * @param {boolean} options.follow
 * @param {'deploy-start' | 'deploy-end' | 'never'} options.exitOnDeploy
 * @returns {Promise<void>}
 */
export async function restartApplication(options) {
  const { alias, app: appIdOrName, quiet, commit, withoutCache, follow, exitOnDeploy } = options;

  const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const git = await Git.get();
  const fullCommitId = await git.resolveFullCommitId(commit);
  const app = await Application.get(ownerId, appId);

  if (app == null) {
    throw new Error("The application doesn't exist");
  }

  const remoteCommitId = app.commitId;

  const commitId = fullCommitId || remoteCommitId;
  if (commitId != null) {
    const cacheSuffix = withoutCache ? ' without using cache' : '';
    Logger.println(`🔄 Restarting ${styleText('bold', app.name)}${cacheSuffix} ${styleText('grey', `(${commitId})`)}`);
  }

  // This should be handled by the API when a deployment ID is set but we'll do this for now
  const redeployDate = new Date();

  const redeploy = await Application.redeploy(ownerId, appId, fullCommitId, withoutCache);

  return Log.watchDeploymentAndDisplayLogs({
    ownerId,
    appId,
    deploymentId: redeploy.deploymentId,
    quiet,
    redeployDate,
    exitStrategy,
  });
}
