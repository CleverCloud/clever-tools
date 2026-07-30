import { GetPrimaryDomainCommand } from '@clevercloud/client/cc-api-commands/domain/get-primary-domain-command.js';
import { parse as parseDomain } from 'tldts';
import { clients } from './cc-api-client.js';

export async function getFavouriteDomain({ ownerId, appId }) {
  const favouriteDomain = await clients.ccApi.send(new GetPrimaryDomainCommand({ ownerId, applicationId: appId }));
  return favouriteDomain?.domain ?? null;
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
