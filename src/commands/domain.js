import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import {
  addDomain,
  get as getApp,
  getAllDomains,
  getFavouriteDomain as getFavouriteDomainWithError,
  markFavouriteDomain,
  removeDomain,
  unmarkFavouriteDomain,
} from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../models/send-to-api.js';
import { getSummary } from '@clevercloud/client/cjs/api/v2/user.js';
import { parse as parseDomain } from 'tldts';
import _ from 'lodash';
import colors from 'colors/safe.js';

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

export async function overview (params) {

  const { format, filter } = params.options;

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
      const domains = await getAllDomains({ id: app.ownerId, appId: app.id }).then(sendToApi);
      return { app, domains };
    }),
  );

  const applicationsWithParsedDomain = applicationsWithDomains
    .flatMap(({ app, domains }) => {
      return domains
        .filter((domain) => filter == null || domain.fqdn.includes(filter))
        .map((domain) => {

          const parsedDomain = parseDomain(domain.fqdn);
          const pathname = new URL('https://' + domain.fqdn).pathname;
          const subdomains = parsedDomain.subdomain !== '' ? parsedDomain.subdomain.split('.') : [];

          // We're trying to create an propertyPath for lodash to create a tree structure object,
          // the propertyPath for `aaa.bbb.ccc.example.com/the-path` would be:
          // ["example.com", "example.com.ccc", "example.com.ccc.bbb", "example.com.ccc.bbb.aaa", "/path-aaa"]",

          const sortSegments = [parsedDomain.domain, ...subdomains.reverse()];
          const propetyPath = sortSegments.map((item, i, all) => {
            return all.slice(0, i + 1).reverse().join('.');
          });
          propetyPath.push(pathname);

          return {
            ownerId: app.ownerId,
            ownerName: app.ownerName,
            appId: app.id,
            appName: app.name,
            appConsoleUrl: `${consoleUrl}/${app.id}`,
            appVariantSlug: app.variantSlug,
            domain: domain.fqdn,
            propetyPath,
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
        Logger.println(`No matches for filter "${filter}"`);
      }
      else {
        recursiveDisplay(applicationsWithParsedDomainAsSortedTree);
      }
      break;
  }
}

function recursiveSort (obj) {

  if (typeof obj === 'object' && obj.appId != null) {
    return obj;
  }

  const sortedObj = {};
  Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach((key) => {
    sortedObj[key] = recursiveSort(obj[key]);
  });

  return sortedObj;
}

function recursiveDisplay (obj, indentLevel = 0, isLast) {

  if (typeof obj === 'object' && obj.appId != null) {
    Logger.println(' '.repeat(indentLevel) + `${obj.ownerName} / ${obj.appName} / ${obj.appVariantSlug}`);
    Logger.println(' '.repeat(indentLevel) + colors.blue(obj.appConsoleUrl));
    return;
  }

  for (const [propertyPath, subObj] of Object.entries(obj)) {
    if (propertyPath !== '/') {
      Logger.println('');
      Logger.println(' '.repeat(indentLevel) + colors.yellow(propertyPath));
      recursiveDisplay(subObj, indentLevel + 2);
    }
    else {
      recursiveDisplay(subObj, indentLevel);
    }
  }
}
