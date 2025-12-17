import { getAllDomains } from '@clevercloud/client/esm/api/v2/application.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import _ from 'lodash';
import { parse as parseDomain } from 'tldts';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

function recursiveSort(obj) {
  if (typeof obj === 'object' && obj.appId != null) {
    return obj;
  }

  const sortedObj = {};
  Object.keys(obj)
    .sort((a, b) => {
      // if the domain contains a wildcard, we want it to be the first of subdomains
      const aWithReplacedWildcard = a.replace(/^\*/, 'a');
      const bWithReplacedWildcard = b.replace(/^\*/, 'a');
      return aWithReplacedWildcard.localeCompare(bWithReplacedWildcard);
    })
    .forEach((key) => {
      sortedObj[key] = recursiveSort(obj[key]);
    });

  return sortedObj;
}

function recursiveDisplay(obj, indentLevel = 0) {
  if (typeof obj === 'object' && obj.appId != null) {
    Logger.printlnWithIndent(`${obj.ownerName} | ${obj.appName} (${obj.appVariantSlug})`, indentLevel);
    Logger.printlnWithIndent(styleText('blue', obj.appConsoleUrl), indentLevel);
    return;
  }

  for (const [propertyPath, subObj] of Object.entries(obj)) {
    if (propertyPath !== '/') {
      Logger.println('');
      Logger.printlnWithIndent(styleText('yellow', propertyPath), indentLevel);
      recursiveDisplay(subObj, indentLevel + 2);
    } else {
      recursiveDisplay(subObj, indentLevel);
    }
  }
}

export const domainOverviewCommand = defineCommand({
  description: 'Get an overview of all your domains (all orgas, all apps)',
  since: '3.9.0',
  sinceDate: '2024-10-23',
  options: {
    filter: defineOption({
      name: 'filter',
      schema: z.string().default(''),
      description: 'Get only domains containing the provided text',
      placeholder: 'text',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format, filter } = options;

    const summary = await getSummary().then(sendToApi);
    const consoleUrl = summary.user.partnerConsoleUrl;

    const applications = [
      ...summary.user.applications.map((app) => {
        return { ownerName: summary.user.name, ownerId: summary.user.id, ...app };
      }),
      ...summary.organisations.flatMap((o) => {
        return o.applications.map((app) => {
          return { ownerName: o.name, ownerId: o.id, ...app };
        });
      }),
    ];

    const applicationsWithDomains = await Promise.all(
      applications.map(async (app) => {
        const domains = await getAllDomains({ id: app.ownerId, appId: app.id })
          .then(sendToApi)
          .catch((error) => {
            // if the user cannot access application domains, we simply act as if there were no domains
            if (error?.response?.status === 403) {
              Logger.printErrorLine(`You cannot list domains for application ${app.name} (${app.id})`);
              return [];
            }
            throw error;
          });
        return { app, domains };
      }),
    );

    const applicationsWithParsedDomain = applicationsWithDomains.flatMap(({ app, domains }) => {
      return domains
        .filter((domain) => filter == null || domain.fqdn.includes(filter))
        .map((domain) => {
          // `validateHostname` is set to `false` so that wildcard domains may be parsed correctly
          const parsedDomain = parseDomain(domain.fqdn, { validateHostname: false });
          const pathname = new URL('https://' + domain.fqdn).pathname;
          const subdomains = parsedDomain.subdomain !== '' ? parsedDomain.subdomain.split('.') : [];

          // We're trying to create a propertyPath for lodash to create a tree structure object,
          // the propertyPath for `aaa.bbb.ccc.example.com/the-path` would be:
          // ["example.com", "example.com.ccc", "example.com.ccc.bbb", "example.com.ccc.bbb.aaa", "/path-aaa"]",

          const sortSegments = [parsedDomain.domain, ...subdomains.reverse()];
          const propertyPath = sortSegments.map((item, i, all) => {
            return all
              .slice(0, i + 1)
              .reverse()
              .join('.');
          });
          propertyPath.push(pathname);

          return {
            ownerId: app.ownerId,
            ownerName: app.ownerName,
            appId: app.id,
            appName: app.name,
            appConsoleUrl: `${consoleUrl}/goto/${app.id}`,
            appVariantSlug: app.variantSlug,
            domain: domain.fqdn,
            propetyPath: propertyPath,
          };
        });
    });

    const applicationsWithParsedDomainAsTree = {};
    for (const { propetyPath, ...appWithDomain } of applicationsWithParsedDomain) {
      _.set(applicationsWithParsedDomainAsTree, propetyPath, appWithDomain);
    }

    const applicationsWithParsedDomainAsSortedTree = recursiveSort(applicationsWithParsedDomainAsTree);

    switch (format) {
      case 'json':
        Logger.printJson(applicationsWithParsedDomainAsSortedTree);
        break;
      case 'human':
      default:
        if (Object.keys(applicationsWithParsedDomainAsSortedTree).length === 0) {
          if (filter?.length > 0) {
            Logger.println(`No matches for filter "${filter}"`);
          } else {
            Logger.println('No domains');
          }
        } else {
          recursiveDisplay(applicationsWithParsedDomainAsSortedTree);
        }
        break;
    }
  },
});
