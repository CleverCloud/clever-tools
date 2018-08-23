'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git');
const handleCommandStream = require('../command-stream-handler');
const Log = require('../models/log');
const Logger = require('../logger.js');

function restart (api, params) {
  const { alias, quiet, commit, 'without-cache': withoutCache } = params.options;

  const s_appData = AppConfig.getAppData(alias);
  const s_fullCommitId = git.resolveFullCommitId(commit);
  const s_remoteCommitId = s_appData
    .flatMapLatest(({ app_id, app_orga }) => Application.get(api, app_id, app_orga))
    .flatMapLatest(({ commitId }) => commitId);

  const s_allLogs = Bacon
    .combineAsArray(s_appData, s_fullCommitId, s_remoteCommitId)
    .flatMapLatest(([appData, fullCommitId, remoteCommitId]) => {
      const commitId = fullCommitId || remoteCommitId;
      const cacheSuffix = withoutCache ? ' without using cache' : '';
      Logger.println(`Restarting ${appData.name} on commit #${commitId}${cacheSuffix}`);
      const s_redeploy = Application.redeploy(api, appData.app_id, appData.org_id, fullCommitId, withoutCache);
      return Bacon.combineAsArray(s_redeploy, appData, remoteCommitId);
    })
    .flatMapLatest(([redeploy, appData, remoteCommitId]) => {
      return Log.getAllLogs(api, redeploy, appData, remoteCommitId, quiet);
    })
    .map(Logger.println);

  handleCommandStream(s_allLogs);
};

module.exports = restart;
