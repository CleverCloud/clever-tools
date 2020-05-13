'use strict';

const AppConfig = require('../models/app_configuration.js');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

async function appLogs (params) {
  const { alias, before, after, search, 'deployment-id': deploymentId } = params.options;
  const { addon: addonId } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;
  const appAddonId = addonId || await AppConfig.getAppDetails({ alias }).then(({ appId }) => appId);
  const s_logs = Log.getAppLogs(appAddonId, null, before, after, filter, deploymentId);

  s_logs.onValue(Logger.println);
  return s_logs.toPromise();
}

module.exports = { appLogs };
