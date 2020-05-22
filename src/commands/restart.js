'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git.js');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

// Once the API call to redeploy() has been triggerred successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network pb)
async function restart (params) {
  const { alias, quiet, commit, 'without-cache': withoutCache } = params.options;

  const { ownerId, appId, name: appName } = await AppConfig.getAppDetails({ alias });
  const fullCommitId = await git.resolveFullCommitId(commit);
  const app = await Application.get(ownerId, appId);
  const remoteCommitId = app.commitId;

  const commitId = fullCommitId || remoteCommitId;
  if (commitId != null) {
    const cacheSuffix = withoutCache ? ' without using cache' : '';
    Logger.println(`Restarting ${appName} on commit ${colors.green(commitId)}${cacheSuffix}`);
  }

  const redeploy = await Application.redeploy(ownerId, appId, fullCommitId, withoutCache);

  return Log.watchDeploymentAndDisplayLogs({ ownerId, appId, deploymentId: redeploy.deploymentId, quiet });
}

module.exports = { restart };
