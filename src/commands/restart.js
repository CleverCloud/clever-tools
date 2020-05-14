'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git');
const Log = require('../models/log');
const Logger = require('../logger.js');

async function restart (params) {
  const { alias, quiet, commit, 'without-cache': withoutCache } = params.options;

  const appData = await AppConfig.getAppDetails({ alias });
  const fullCommitId = await git.resolveFullCommitId(commit);
  const app = await Application.get(appData.ownerId, appData.appId);
  const remoteCommitId = app.commitId;

  const commitId = fullCommitId || remoteCommitId;
  if (commitId != null) {
    const cacheSuffix = withoutCache ? ' without using cache' : '';
    Logger.println(`Restarting ${appData.name} on commit ${colors.green(commitId)}${cacheSuffix}`);
  }
  const redeploy = await Application.redeploy(appData.ownerId, appData.appId, fullCommitId, withoutCache);
  const s_logs = await Log.getAllLogs(redeploy, appData, remoteCommitId, quiet);
  s_logs.onValue(Logger.println);
  return s_logs.toPromise();
}

module.exports = { restart };
