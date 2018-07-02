'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

function appLogs (api, params) {
  const { alias, before, after, search, 'deployment-id': deploymentId } = params.options;
  const { addon: addonId } = params.options;

  const s_appAddonId = (addonId != null)
    ? Bacon.once(addonId)
    : AppConfig.getAppData(alias).flatMapLatest((app_data) => app_data.app_id);

  const s_logs = s_appAddonId
    .flatMapLatest((appAddonId) => {
      return Log.getAppLogs(api, appAddonId, null, before, after, search, deploymentId);
    })
    .map(Logger.println);

  handleCommandStream(s_logs);
}

module.exports = appLogs;
