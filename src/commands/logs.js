import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { resolveOwnerId, resolveRealId } from '../models/ids-resolver.js';
import * as Log from '../models/log-v4.js';
import { Deferred } from '../models/utils.js';

export async function appLogs(params) {
  const {
    alias,
    app: appIdOrName,
    addon: addonIdOrRealId,
    after: since,
    before: until,
    search,
    'deployment-id': deploymentId,
    format,
  } = params.options;

  // ignore --search ""
  const filter = search !== '' ? search : null;
  const isForHuman = format === 'human';

  // TODO: drop when addons are migrated to the v4 API
  if (addonIdOrRealId != null) {
    const addonId = await resolveRealId(addonIdOrRealId);
    const ownerId = await resolveOwnerId(addonId);
    if (isForHuman) {
      Logger.println(styleText('blue', 'Waiting for addon logs…'));
    } else {
      throw new Error(`"${format}" format is not yet available for add-on logs`);
    }

    const deferred = new Deferred();
    await Log.displayAddonLogs({ ownerId, addonId, since, until, filter, deploymentId, format, deferred });
    return deferred.promise;
    //return LogV2.displayLogs({ appAddonId: addonId, since, until, filter, deploymentId });
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  if (isForHuman) {
    Logger.println(styleText('blue', 'Waiting for application logs…'));
  }

  const deferred = new Deferred();
  await Log.displayLogs({ ownerId, appId, since, until, filter, deploymentId, format, deferred });
  return deferred.promise;
}
