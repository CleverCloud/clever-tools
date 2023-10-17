'use strict';

const AppConfig = require('../models/app_configuration.js');
const LogV2 = require('../models/log.js');
const Log = require('../models/log-v4.js');
const Logger = require('../logger.js');
const { Deferred } = require('../models/utils.js');

async function appLogs (params) {
  const { alias, after: since, before: until, search, 'deployment-id': deploymentId } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;

  const { appId, ownerId } = await AppConfig.getAppDetails({ alias });

  Logger.println('Waiting for application logs…');

  // TODO: drop when addons are migrated to the v4 API
  if (params.addon) {
    const { addon: addonId } = params.options;
    const appAddonId = addonId || await AppConfig.getAppDetails({ alias }).then(({ appId }) => appId);
    return LogV2.displayLogs({ appAddonId, since, until, filter, deploymentId });
  }

  const deferred = new Deferred();
  await Log.displayLogs({ ownerId, appId, since, until, filter, deploymentId, deferred });
  return deferred.promise;
}

module.exports = { appLogs };
