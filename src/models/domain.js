import {
  getAllDomains,
  getFavouriteDomain as getFavouriteDomainWithError,
} from '@clevercloud/client/esm/api/v2/application.js';
import _ from 'lodash';
import { parse as parseDomain } from 'tldts';
import { Logger } from '../logger.js';
import { sendToApi } from './send-to-api.js';

export async function getBest(appId, orgaId) {
  Logger.debug('Trying to get the favourite vhost for ' + appId);
  return getFavouriteDomainWithError({ id: orgaId, appId })
    .then(sendToApi)
    .catch(async (e) => {
      if (e.response.status !== 404) {
        throw e;
      }

      Logger.debug('No favourite vhost defined for ' + appId + ', selecting the best one');
      const allDomains = await getAllDomains({ id: orgaId, appId }).then(sendToApi);
      const result = selectBest(allDomains);

      if (result == null) {
        throw new Error("Couldn't find a domain name");
      }

      return result;
    });
}

export function selectBest(vhosts) {
  const customVhost = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.endsWith('.cleverapps.io');
  });
  const withoutDefaultDomain = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.match(
      /^app-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.cleverapps\.io$/,
    );
  });
  return customVhost || withoutDefaultDomain || vhosts[0];
}

export function getFavouriteDomain({ ownerId, appId }) {
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

export function getDomainObject(domainWithPathPrefix, favouriteDomain) {
  const parsed = parseDomain(domainWithPathPrefix, { validateHostname: false });
  return {
    domainWithPathPrefix,
    domain: parsed.domain,
    domainWithoutSuffix: parsed.domainWithoutSuffix,
    hostname: parsed.hostname,
    publicSuffix: parsed.publicSuffix,
    subdomain: parsed.subdomain,
    isApex: parsed.subdomain === '',
    pathPrefix: new URL('https://' + domainWithPathPrefix).pathname,
    isFavourite: domainWithPathPrefix === favouriteDomain,
  };
}
