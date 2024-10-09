import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import { get as getApp, addDomain, getFavouriteDomain as getFavouriteDomainWithError, markFavouriteDomain, unmarkFavouriteDomain, removeDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import colors from 'colors/safe.js';
import { parse as parseDomain } from 'tldts';
import { diagDomainConfig } from '@clevercloud/client/esm/utils/diag-domain-config.js';
import { NodeDnsResolver } from '../models/node-dns-resolver.js';

/**
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').DomainInfo} DomainInfo
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').ResolveDnsResult} ResolveDnsResult
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').DomainDiag} DomainDiag
 */

const resolver = new NodeDnsResolver();

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

export async function diagApplication (params) {
  let hasError = false;
  const allDomainDiagnostics = [];
  const { alias, app: appIdOrName, format, domain } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const hasDomainFilter = domain.length > 0;

  const app = await getApp({ id: ownerId, appId }).then(sendToApi);
  const expectedDnsForPublicLoadBalancer = await getDefaultLoadBalancersDnsInfo({ id: ownerId, appId }).then(sendToApi);

  const loadBalancerDnsConfig = {
    aRecords: expectedDnsForPublicLoadBalancer[0].dns.a,
    cnameRecord: expectedDnsForPublicLoadBalancer[0].dns.cname,
  };

  const filteredDomains = app.vhosts.filter(({ fqdn }) => fqdn.includes(domain));
  const domains = getParsedDomains(filteredDomains);
  const sortedDomains = sortDomains(domains);

  for (const { hostname, pathPrefix, isApex } of sortedDomains) {
    const resolvedDnsConfig = {
      aRecords: await resolver.resolveA(hostname),
      cnameRecords: await resolver.resolveCname(hostname) ?? [],
    };

    const diagnosticResults = diagDomainConfig({ hostname, pathPrefix, isApex }, resolvedDnsConfig, loadBalancerDnsConfig);
    allDomainDiagnostics.push({ ...diagnosticResults, resolvedDnsConfig });

    if (diagnosticResults.diagSummary === 'invalid' || diagnosticResults.diagSummary === 'no-config') {
      hasError = true;
    }
  }

  switch (format) {
    case 'json':
      Logger.printJson(allDomainDiagnostics);
      break;
    default: {
      if (allDomainDiagnostics.length > 0) {
        Logger.println(colors.yellow('\n⚠ TODO avec David, une phrase pour dire qu\'on ne supporte pas tout + se référer à la doc de la commande + un lien vers feedback ?'));

      }
      allDomainDiagnostics.forEach((diag) => reportDomainDiagnostics(diag));

      if (allDomainDiagnostics.length === 0 && !hasDomainFilter) {
        Logger.println(`\nNo domain associated to the app "${app.name}" (${app.id})`);
      }

      if (allDomainDiagnostics.length === 0 && hasDomainFilter) {
        Logger.println(`\nNo domain matches "${domain}" for the app "${app.name}" (${app.id})`);
      }
    }
  }

  if (hasError) {
    throw new Error('At least one of the domains is misconfigured');
  }
}

/** @param {DomainDiag & { resolvedDnsConfig: ResolveDnsResult }} domainDiag */
function reportDomainDiagnostics ({ hostname, pathPrefix, resolvedDnsConfig, diagDetails, diagSummary }) {

  const validDiags = diagDetails.filter((diag) => diag.code === 'valid-a');
  const unknownDiags = diagDetails.filter((diag) => diag.code === 'unknown-a');
  const missingDiags = diagDetails.filter((diag) => diag.code === 'missing-a');
  const suggestedCname = diagDetails.find((diag) => diag.code === 'suggested-cname');
  const missingCname = diagDetails.find((diag) => diag.code === 'missing-cname');
  const unknownCname = diagDetails.find((diag) => diag.code === 'unknown-cname');

  const hasARecords = resolvedDnsConfig.aRecords.length > 0;
  const hasCnameRecord = resolvedDnsConfig.cnameRecords.length > 0;

  Logger.println('\n' + colors.blue(hostname) + ' ' + colors.yellow(pathPrefix) + '\n');

  switch (diagSummary) {
    case 'managed':
      Logger.println(' '.repeat(2) + colors.green('✔ Managed by Clever Cloud'));
      Logger.println(' '.repeat(2) + 'ⓘ Should only be used for testing purposes');
      break;
    case 'no-config':
      Logger.println(' '.repeat(2) + colors.red('✘ No DNS configuration found'));
      break;
    case 'valid':
      Logger.println(' '.repeat(2) + colors.green('✔ Your configuration is valid'));
      break;
    case 'invalid':
      Logger.println(' '.repeat(2) + colors.red('✘ Something is wrong with your configuration'));
      break;
    case 'incomplete':
      Logger.println(' '.repeat(2) + colors.yellow('⚠ Your configuration is incomplete'));
      break;
  }

  // Valid records
  if (validDiags.length > 0) {
    Logger.println('');
    validDiags.forEach((diag) => {
      Logger.println(' '.repeat(2) + diag.record.value, colors.green('✔ A Record OK'), hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '');
    });
  }

  // Replace A with CNAME
  if (diagSummary === 'valid' && suggestedCname != null) {
    Logger.println('');
    Logger.println(' '.repeat(2) + 'ⓘ You can replace your A records with this CNAME:');
    Logger.println(' '.repeat(2) + ' '.repeat(4) + suggestedCname.record.value);
  }

  // Replace A Records with CNAME
  if (missingCname != null && unknownCname == null && (diagSummary === 'invalid' || diagSummary === 'incomplete')) {
    const cnameToUse = suggestedCname != null ? suggestedCname.record.value : missingCname.record.value;

    Logger.println('');
    Logger.println(' '.repeat(2) + '⇄ Replace your A records with this CNAME:');
    Logger.println(' '.repeat(2) + ' '.repeat(4) + cnameToUse);
    Logger.println('');
    Logger.println(' '.repeat(2) + 'or:');
  }

  // Replace unknown CNAME with missing CNAME
  if ((diagSummary === 'invalid') && missingCname != null && unknownCname != null) {
    Logger.println('');
    Logger.println(' '.repeat(2) + '➖Remove this CNAME record:');
    Logger.println(' '.repeat(2) + ' '.repeat(4) + unknownCname.record.value + '. ');
    Logger.println('');
    Logger.println(' '.repeat(2) + '➕Add this CNAME record instead:');
    Logger.println(' '.repeat(2) + ' '.repeat(4) + missingCname.record.value);

    if (hasARecords) {
      Logger.println('');
      Logger.println(' '.repeat(2) + 'or:');
    }
  }

  // Add CNAME
  if (diagSummary === 'no-config' && missingCname != null) {
    Logger.println('');
    Logger.println(' '.repeat(2) + '➕Add this CNAME record:');
    Logger.println(' '.repeat(2) + ' '.repeat(4) + missingCname.record.value);
  }

  // Remove Unknown records
  if (unknownDiags.length > 0) {
    Logger.println('');
    Logger.println(' '.repeat(2) + '➖Remove these A records:');

    unknownDiags.forEach((diag) => {
      Logger.println(' '.repeat(2) + ' '.repeat(4) + diag.record.value, hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '');
    });
  }

  // Add missing A records
  if (missingDiags.length > 0) {
    Logger.println('');
    Logger.println(' '.repeat(2) + '➕Add these A records:');

    missingDiags.forEach((missingDiag) => Logger.println(' '.repeat(2) + ' '.repeat(4) + missingDiag.record.value));
  }
}

// TODO: put in clever client
function getDefaultLoadBalancersDnsInfo (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/load-balancers/organisations/${params.id}/applications/${params.appId}/load-balancers/default`,
    headers: {
      Accept: 'application/json',
    },
    // no query params
    // no body
  });
}

/**
 * Parses domain information from vhosts array
 *
 * @param {Array<{ fqdn: string }>} vhosts
 * @returns {Array<Partial<DomainInfo>>} Array of parsed domain objects
 */
function getParsedDomains (vhosts) {
  return vhosts.map(({ fqdn }) => {
    const { hostname, pathname } = new URL('https://' + fqdn);
    const { subdomain } = parseDomain(fqdn);

    return { hostname, pathPrefix: pathname, isApex: subdomain === '' };
  });
}

/**
 * Sorts an array of parsed domain by hostname (alphabetical order)
 *
 * @param {Array<Partial<DomainInfo>>} parsedDomains - Array of parsed domains to sort
 * @returns {Array<Partial<DomainInfo>>} Sorted array of parsed domains
 */
function sortDomains (parsedDomains) {
  return parsedDomains
    .slice()
    .sort((a, b) => {
      const reverseA = a.hostname.split('.').reverse().join('.');
      const reverseB = b.hostname.split('.').reverse().join('.');
      return reverseA.localeCompare(reverseB);
    });
}
