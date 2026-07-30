import { ListDomainCommand } from '@clevercloud/client/cc-api-commands/domain/list-domain-command.js';
import { GetOrganisationSummariesCommand } from '@clevercloud/client/cc-api-commands/organisation/get-organisation-summaries-command.js';
import { GetProfileCommand } from '@clevercloud/client/cc-api-commands/profile/get-profile-command.js';
import { tolerateStatus } from '@clevercloud/client/utils/error-utils.js';
import _ from 'lodash';
import { parse as parseDomain } from 'tldts';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
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

    const [summaries, profile] = await Promise.all([
      clients.ccApi.send(new GetOrganisationSummariesCommand()),
      clients.ccApi.send(new GetProfileCommand()),
    ]);
    const consoleUrl = profile.partnerConsoleUrl;

    const applications = summaries.flatMap((owner) => {
      return owner.applications.map((app) => {
        return { ownerName: owner.name, ownerId: owner.id, ...app };
      });
    });

    const applicationsWithDomains = await Promise.all(
      applications.map(async (app) => {
        // if the user cannot access application domains (403), we simply act as if there were no domains
        const domains = await tolerateStatus(
          clients.ccApi.send(new ListDomainCommand({ ownerId: app.ownerId, applicationId: app.id })),
          403,
        );
        if (domains == null) {
          return [];
        }

        return { app, domains };
      }),
    );

    const applicationsWithParsedDomain = applicationsWithDomains.flatMap(({ app, domains }) => {
      return domains
        .filter((domain) => filter == null || domain.domain.includes(filter))
        .map((domain) => {
          // `validateHostname` is set to `false` so that wildcard domains may be parsed correctly
          const parsedDomain = parseDomain(domain.domain, { validateHostname: false });
          const pathname = new URL('https://' + domain.domain).pathname;
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
            domain: domain.domain,
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
