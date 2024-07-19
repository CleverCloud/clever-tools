import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import { get as getApp, addDomain, getFavouriteDomain as getFavouriteDomainWithError, markFavouriteDomain, unmarkFavouriteDomain, removeDomain } from '@clevercloud/client/cjs/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';

function getFavouriteDomain ({ ownerId, appId }) {
  return getFavouriteDomainWithError({ id: ownerId, appId })
    .then(sendToApi)
    .then(({ fqdn }) => fqdn)
    .catch((error) => {
      if (error.id === 4021) {
        // No favourite vhost
        return null;
      }
      throw error;
    });
}

export async function list (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const app = await getApp({ id: ownerId, appId }).then(sendToApi);
  const favouriteDomain = await getFavouriteDomain({ ownerId, appId });
  return app.vhosts.forEach(({ fqdn }) => {
    const prefix = (fqdn === favouriteDomain)
      ? '* '
      : '  ';
    Logger.println(prefix + fqdn);
  });
}

export async function add (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const encodedFqdn = encodeURIComponent(fqdn);

  await addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully saved');
}

export async function getFavourite (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const favouriteDomain = await getFavouriteDomain({ ownerId, appId });

  if (favouriteDomain == null) {
    return Logger.println('No favourite domain set');
  }

  return Logger.println(favouriteDomain);
}

export async function setFavourite (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await markFavouriteDomain({ id: ownerId, appId }, { fqdn }).then(sendToApi);
  Logger.println('Your favourite domain has been successfully set');
}

export async function unsetFavourite (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
  Logger.println('Favourite domain has been successfully unset');
}

export async function rm (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const encodedFqdn = encodeURIComponent(fqdn);

  await removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully removed');
}
