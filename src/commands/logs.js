'use strict';

const AppConfig = require('../models/app_configuration.js');
const LogV2 = require('../models/log.js');
const Log = require('../models/log-v4.js');
const Logger = require('../logger.js');
const { Deferred } = require('../models/utils.js');
const colors = require('colors/safe');
const { resolveAddonId } = require('../models/ids-resolver.js');

async function appLogs (params) {
  const { alias, addon: addonIdOrRealId, after: since, before: until, search, 'deployment-id': deploymentId, format } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;
  const isForHuman = (format === 'human');

  // TODO: drop when addons are migrated to the v4 API
  if (addonIdOrRealId != null) {
    const addonId = await resolveAddonId(addonIdOrRealId);
    if (isForHuman) {
      Logger.println(colors.blue('Waiting for addon logs…'));
    }
    else {
      throw new Error(`"${format}" format is not yet available for add-on logs`);
    }
    return LogV2.displayLogs({ appAddonId: addonId, since, until, filter, deploymentId });
  }

  const { appId, ownerId } = await AppConfig.getAppDetails({ alias });

  if (isForHuman) {
    Logger.println(colors.blue('Waiting for application logs…'));
  }

  const deferred = new Deferred();
  await Log.displayLogs({ ownerId, appId, since, until, filter, deploymentId, format, deferred });
  return deferred.promise;
}

module.exports = { appLogs };
