import colors from 'colors/safe.js';

import * as Application from '../models/application.js';
import * as git from '../models/git.js';
import * as Log from '../models/log-v4.js';
import { Logger } from '../logger.js';
import * as ExitStrategy from '../models/exit-strategy-option.js';

// Once the API call to redeploy() has been triggerred successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network pb)
export async function restart (params) {
  const { alias, app: appIdOrName, quiet, commit, 'without-cache': withoutCache, follow, 'exit-on': exitOnDeploy } = params.options;

  const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const fullCommitId = await git.resolveFullCommitId(commit);
  const app = await Application.get(ownerId, appId);

  if (app == null) {
    throw new Error('The application doesn\'t exist');
  }

  const remoteCommitId = app.commitId;

  const commitId = fullCommitId || remoteCommitId;
  if (commitId != null) {
    const cacheSuffix = withoutCache ? ' without using cache' : '';
    Logger.println(`Restarting ${app.name} on commit ${colors.green(commitId)}${cacheSuffix}`);
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
