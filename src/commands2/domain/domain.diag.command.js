import { get as getApp } from '@clevercloud/client/esm/api/v2/application.js';
import { getDefaultLoadBalancersDnsInfo } from '@clevercloud/client/esm/api/v4/load-balancers.js';
import { diagDomainConfig } from '@clevercloud/client/esm/utils/diag-domain-config.js';
import { sortDomains } from '@clevercloud/client/esm/utils/domains.js';
import { parse as parseDomain } from 'tldts';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { DnsResolver } from '../../models/node-dns-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

function reportDomainDiagnostics({ hostname, pathPrefix, resolvedDnsConfig, diagDetails, diagSummary }) {
  const validDiags = diagDetails.filter((diag) => diag.code === 'valid-a');
  const unknownDiags = diagDetails.filter((diag) => diag.code === 'unknown-a');
  const missingDiags = diagDetails.filter((diag) => diag.code === 'missing-a');
  const suggestedCname = diagDetails.find((diag) => diag.code === 'suggested-cname');
  const missingCname = diagDetails.find((diag) => diag.code === 'missing-cname');
  const unknownCname = diagDetails.find((diag) => diag.code === 'unknown-cname');

  const hasARecords = resolvedDnsConfig.aRecords.length > 0;
  const hasCnameRecord = resolvedDnsConfig.cnameRecords.length > 0;

  Logger.println('\n' + styleText('blue', hostname) + styleText('yellow', pathPrefix) + '\n');

  switch (diagSummary) {
    case 'managed':
      Logger.printlnWithIndent(styleText('green', '✔ Managed by Clever Cloud'), 2);
      Logger.printlnWithIndent('ⓘ cleverapps.io domains should only be used for testing purposes', 2);
      break;
    case 'no-config':
      Logger.printlnWithIndent(styleText('red', '✘ No DNS configuration found'), 2);
      break;
    case 'valid':
      Logger.printlnWithIndent(styleText('green', '✔ Your configuration is valid'), 2);
      break;
    case 'invalid':
      Logger.printlnWithIndent(styleText('red', '✘ Something is wrong with your configuration'), 2);
      break;
    case 'incomplete':
      Logger.printlnWithIndent(styleText('yellow', '⚠ Your configuration is incomplete'), 2);
      break;
  }

  // Valid records
  if (validDiags.length > 0) {
    Logger.println('');
    validDiags.forEach((diag) => {
      const source = hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '';
      Logger.printlnWithIndent(`${diag.record.value} ${styleText('green', '✔ A Record OK')} ${source}`, 2);
    });
  }

  // Replace A with CNAME
  if (diagSummary === 'valid' && suggestedCname != null) {
    Logger.println('');
    Logger.printlnWithIndent('ⓘ You can replace your A records with this CNAME:', 2);
    Logger.printlnWithIndent(suggestedCname.record.value, 6);
  }

  // Replace A Records with CNAME
  if (missingCname != null && unknownCname == null && (diagSummary === 'invalid' || diagSummary === 'incomplete')) {
    const cnameToUse = suggestedCname != null ? suggestedCname.record.value : missingCname.record.value;

    Logger.println('');
    Logger.printlnWithIndent('⇄ Replace your A records with this CNAME:', 2);
    Logger.printlnWithIndent(cnameToUse, 6);
    Logger.println('');
    Logger.printlnWithIndent('or:', 2);
  }

  // Replace unknown CNAME with missing CNAME
  if (diagSummary === 'invalid' && missingCname != null && unknownCname != null) {
    Logger.println('');
    Logger.printlnWithIndent('➖Remove this CNAME record:', 2);
    Logger.printlnWithIndent(unknownCname.record.value + '. ', 6);
    Logger.println('');
    Logger.printlnWithIndent('➕Add this CNAME record instead:', 2);
    Logger.printlnWithIndent(missingCname.record.value, 6);

    if (hasARecords) {
      Logger.println('');
      Logger.printlnWithIndent('or:', 2);
    }
  }

  // Add CNAME
  if (diagSummary === 'no-config' && missingCname != null) {
    Logger.println('');
    Logger.printlnWithIndent('➕Add this CNAME record:', 2);
    Logger.printlnWithIndent(missingCname.record.value, 6);
  }

  // Remove Unknown records
  if (unknownDiags.length > 0) {
    Logger.println('');
    Logger.printlnWithIndent('➖Remove these A records:', 2);

    unknownDiags.forEach((diag) => {
      const source = hasCnameRecord ? `(from CNAME ${resolvedDnsConfig.cnameRecords[0]}.)` : '';
      Logger.printlnWithIndent(`${diag.record.value} ${source}`, 6);
    });
  }

  // Add missing A records
  if (missingDiags.length > 0) {
    Logger.println('');
    Logger.printlnWithIndent('➕Add these A records:', 2);

    missingDiags.forEach((missingDiag) => Logger.printlnWithIndent(missingDiag.record.value, 6));
  }
}

function getParsedDomains(vhosts) {
  return vhosts.map(({ fqdn }) => {
    const { hostname, pathname } = new URL('https://' + fqdn);
    const { subdomain } = parseDomain(fqdn);

    return { hostname, pathPrefix: pathname, isApex: subdomain === '' };
  });
}

export const domainDiagCommand = defineCommand({
  description: 'Check if domains associated to a specific app are properly configured',
  since: '3.9.0',
  options: {
    filter: defineOption({
      name: 'filter',
      schema: z.string().default(''),
      description: 'Check only domains containing the provided text',
      placeholder: 'text',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const dnsResolver = new DnsResolver();
    const allDomainDiagnostics = [];
    const { alias, app: appIdOrName, format, filter } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const hasDomainFilter = filter.length > 0;
    let hasError = false;

    const app = await getApp({ id: ownerId, appId }).then(sendToApi);
    const expectedDnsForPublicLoadBalancer = await getDefaultLoadBalancersDnsInfo({ ownerId, appId }).then(sendToApi);

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
        cnameRecords: (await dnsResolver.resolveCname(hostname)) ?? [],
      };

      const diagnosticResults = diagDomainConfig(
        {
          hostname,
          pathPrefix,
          isApex,
        },
        resolvedDnsConfig,
        loadBalancerDnsConfig,
      );
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
  },
});
