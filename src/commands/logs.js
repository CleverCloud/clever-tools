'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

function appLogs (params) {
  const { alias, before, after, search, 'deployment-id': deploymentId } = params.options;
  const { addon: addonId } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;

  const s_appAddonId = (addonId != null)
    ? Bacon.once(addonId)
    : Bacon.fromPromise(AppConfig.getAppDetails({ alias })).flatMapLatest((appData) => appData.appId);

  const s_logs = s_appAddonId
    .flatMapLatest((appAddonId) => {
      return Log.getAppLogs(appAddonId, null, before, after, filter, deploymentId);
    })
    .map(Logger.println);

  handleCommandStream(s_logs);
}

module.exports = appLogs;
