'use strict';

const AppConfig = require('../models/app_configuration.js');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

async function appLogs (params) {
  const { alias, after: since, before: until, search, 'deployment-id': deploymentId } = params.options;
  const { addon: addonId } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;
  const appAddonId = addonId || await AppConfig.getAppDetails({ alias }).then(({ appId }) => appId);

  Logger.println('Waiting for application logs…');

  return Log.displayLogs({ appAddonId, since, until, filter, deploymentId });
}

module.exports = { appLogs };
