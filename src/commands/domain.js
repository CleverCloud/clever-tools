import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import { get as getApp, addDomain, getFavouriteDomain as getFavouriteDomainWithError, markFavouriteDomain, unmarkFavouriteDomain, removeDomain } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import colors from 'colors/safe.js';
import { parse as parseDomain } from 'tldts';
import { diagDomainConfig } from '@clevercloud/client/esm/utils/diag-domain-config.js';
import { sortDomains } from '@clevercloud/client/esm/utils/domains.js';
import { DnsResolver } from '../models/node-dns-resolver.js';

/**
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').DomainInfo} DomainInfo
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').ResolveDnsResult} ResolveDnsResult
 * @typedef {import('@clevercloud/client/esm/utils/diag-domain-config.types.js').DomainDiag} DomainDiag
 */

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
  const dnsResolver = new DnsResolver();
  const allDomainDiagnostics = [];
  const { alias, app: appIdOrName, format, filter } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const hasDomainFilter = filter.length > 0;
  let hasError = false;

  const app = await getApp({ id: ownerId, appId }).then(sendToApi);
  const expectedDnsForPublicLoadBalancer = await getDefaultLoadBalancersDnsInfo({ id: ownerId, appId }).then(sendToApi);

  const loadBalancerDnsConfig = {
    aRecords: expectedDnsForPublicLoadBalancer[0].dns.a,
    cnameRecord: expectedDnsForPublicLoadBalancer[0].dns.cname,
  };

  const filteredDomains = app.vhosts.filter(({ fqdn }) => fqdn.includes(filter));
  const domains = getParsedDomains(filteredDomains);
  const sortedDomains = domains.sort(sortDomains);

  for (const { hostname, pathPrefix, isApex } of sortedDomains) {
    const resolvedDnsConfig = {
      aRecords: await dnsResolver.resolveA(hostname),
      cnameRecords: await dnsResolver.resolveCname(hostname) ?? [],
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
      allDomainDiagnostics.forEach((diag) => reportDomainDiagnostics(diag));

      if (allDomainDiagnostics.length === 0 && !hasDomainFilter) {
        Logger.println(`\nNo domain associated to the app "${app.name}" (${app.id})`);
      }

      if (allDomainDiagnostics.length === 0 && hasDomainFilter) {
        Logger.println(`\nNo domain matches "${filter}" for the app "${app.name}" (${app.id})`);
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

  Logger.println('\n' + colors.blue(hostname) + colors.yellow(pathPrefix) + '\n');

  switch (diagSummary) {
    case 'managed':
      printlnWithIndent(colors.green('✔ Managed by Clever Cloud'), 2);
      printlnWithIndent('ⓘ cleverapps.io domains should only be used for testing purposes', 2);
      break;
    case 'no-config':
      printlnWithIndent(colors.red('✘ No DNS configuration found'), 2);
      break;
    case 'valid':
      printlnWithIndent(colors.green('✔ Your configuration is valid'), 2);
      break;
    case 'invalid':
      printlnWithIndent(colors.red('✘ Something is wrong with your configuration'), 2);
      break;
    case 'incomplete':
      printlnWithIndent(colors.yellow('⚠ Your configuration is incomplete'), 2);
      break;
  }

  // Valid records
  if (validDiags.length > 0) {
    Logger.println('');
    validDiags.forEach((diag) => {
      const source = hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '';
      printlnWithIndent(`${diag.record.value} ${colors.green('✔ A Record OK')} ${source}`, 2);
    });
  }

  // Replace A with CNAME
  if (diagSummary === 'valid' && suggestedCname != null) {
    Logger.println('');
    printlnWithIndent('ⓘ You can replace your A records with this CNAME:', 2);
    printlnWithIndent(suggestedCname.record.value, 6);
  }

  // Replace A Records with CNAME
  if (missingCname != null && unknownCname == null && (diagSummary === 'invalid' || diagSummary === 'incomplete')) {
    const cnameToUse = suggestedCname != null ? suggestedCname.record.value : missingCname.record.value;

    Logger.println('');
    printlnWithIndent('⇄ Replace your A records with this CNAME:', 2);
    printlnWithIndent(cnameToUse, 6);
    Logger.println('');
    printlnWithIndent('or:', 2);
  }

  // Replace unknown CNAME with missing CNAME
  if ((diagSummary === 'invalid') && missingCname != null && unknownCname != null) {
    Logger.println('');
    printlnWithIndent('➖Remove this CNAME record:', 2);
    printlnWithIndent(unknownCname.record.value + '. ', 6);
    Logger.println('');
    printlnWithIndent('➕Add this CNAME record instead:', 2);
    printlnWithIndent(missingCname.record.value, 6);

    if (hasARecords) {
      Logger.println('');
      printlnWithIndent('or:', 2);
    }
  }

  // Add CNAME
  if (diagSummary === 'no-config' && missingCname != null) {
    Logger.println('');
    printlnWithIndent('➕Add this CNAME record:', 2);
    printlnWithIndent(missingCname.record.value, 6);
  }

  // Remove Unknown records
  if (unknownDiags.length > 0) {
    Logger.println('');
    printlnWithIndent('➖Remove these A records:', 2);

    unknownDiags.forEach((diag) => {
      const source = hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '';
      printlnWithIndent(diag.record.value + source, 6);
    });
  }

  // Add missing A records
  if (missingDiags.length > 0) {
    Logger.println('');
    printlnWithIndent('➕Add these A records:', 2);

    missingDiags.forEach((missingDiag) => printlnWithIndent(missingDiag.record.value, 6));
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
 * Prints a line of text with specified indentation.
 *
 * @param {string} text - The text to be printed.
 * @param {number} indentLevel - The number of spaces to indent the text.
 */
function printlnWithIndent (text, indentLevel) {
  Logger.println(' '.repeat(indentLevel) + text);
}
