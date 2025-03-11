import * as Application from '../models/application.js';
import * as LogV2 from '../models/log.js';
import * as Log from '../models/log-v4.js';
import { Logger } from '../logger.js';
import { Deferred } from '../models/utils.js';
import colors from 'colors/safe.js';
import { resolveAddonId,  resolveRealId, resolveOwnerId  } from '../models/ids-resolver.js';

export async function appLogs (params) {
  const { alias, app: appIdOrName, addon: addonIdOrRealId, after: since, before: until, search, 'deployment-id': deploymentId, format } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;
  const isForHuman = (format === 'human');

  if (addonIdOrRealId != null) {
    return addonLogs({addonIdOrRealId, isForHuman, since, until, filter, format, since, until, deploymentId, format, filter});
  }

  applicationLogs({appIdOrName, alias, isForHuman})
}

async function applicationLogs({appIdOrName, alias, isForHuman, since, until, deploymentId, format, filter}) {
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  if (isForHuman) {
    Logger.println(colors.blue('Waiting for application logs…'));
  }

  const deferred = new Deferred();
  await Log.displayLogs({ ownerId, appId, since, until, filter, deploymentId, format, deferred });
  return deferred.promise;
}

async function addonLogs({addonIdOrRealId, isForHuman, since, until, filter, format}) {
  let addonId = addonIdOrRealId
  if(addonId.startsWith("addon_")) {
    addonId = await resolveRealId(addonIdOrRealId);
  }

  const ownerId = await resolveOwnerId(addonId)

  if (isForHuman) {
    Logger.println(colors.blue('Waiting for addon logs…'));
  }

  const deferred = new Deferred();
  console.log({ ownerId, addonId, since, until, filter, format, deferred })
  await Log.displayAddonLogs({ ownerId, addonId, since, until, filter, format, deferred });
  return deferred.promise;
}

