'use strict';

const Application = require('../models/application.js');
const { Resolver } = require('dns/promises');
const colors = require('colors/safe');
const Logger = require('../logger.js');
const {
  get: getApp,
  addDomain,
  getFavouriteDomain: getFavouriteDomainWithError,
  markFavouriteDomain,
  unmarkFavouriteDomain,
  removeDomain,
} = require('@clevercloud/client/cjs/api/v2/application.js');
const { sendToApi } = require('../models/send-to-api.js');
const { getSummary } = require('@clevercloud/client/cjs/api/v2/user.js');

const RESOLVERS = {
  dnsEu: '193.110.81.0',
  cloudFlare: '1.1.1.1',
  google: '8.8.8.8',
  google2: '8.8.4.4',
};

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

async function list (params) {
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

async function add (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const encodedFqdn = encodeURIComponent(fqdn);

  await addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully saved');
}

async function getFavourite (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const favouriteDomain = await getFavouriteDomain({ ownerId, appId });

  if (favouriteDomain == null) {
    return Logger.println('No favourite domain set');
  }

  return Logger.println(favouriteDomain);
}

async function setFavourite (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await markFavouriteDomain({ id: ownerId, appId }, { fqdn }).then(sendToApi);
  Logger.println('Your favourite domain has been successfully set');
}

async function unsetFavourite (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
  Logger.println('Favourite domain has been successfully unset');
}

async function rm (params) {
  const [fqdn] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const encodedFqdn = encodeURIComponent(fqdn);

  await removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully removed');
}

async function diagApplication (params) {
  const resolver = new Resolver();
  resolver.setServers([RESOLVERS.dnsEu]);

  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const app = await getApp({ id: ownerId, appId }).then(sendToApi);
  const expectedDnsForPublicLoadBalancer = await getDefaultLoadBalancersDnsInfo({ id: ownerId, appId }).then(sendToApi);

  const routingConfigRaw = getRoutingConfig(app.vhosts);
  const routingConfig = sortRoutingConfig(routingConfigRaw);

  const expectedARecords = expectedDnsForPublicLoadBalancer[0].dns.a;
  const expectedCnameRecord = expectedDnsForPublicLoadBalancer[0].dns.cname.replace(/\.$/, '');

  for (const { hostname, pathPrefix } of routingConfig) {

    console.log(colors.blue(hostname) + ' ' + colors.yellow(pathPrefix));

    const aRecords = await resolveA(hostname);

    // if cleverapps
    if (hostname.endsWith('cleverapps.io')) {
      console.log('  cleverapps.io domains are for test purposes and are automatically configured');
    }

    // if apex
    else if (hostname.split('.').length === 2) {
      validateARecords(aRecords, expectedARecords);
    }

    // if not apex
    else {
      const cnameRecords = await resolveCname(hostname);

      for (const cnameRecord of cnameRecords) {
        // I don't remember why we test if endsWith()
        if (cnameRecord.data === expectedCnameRecord || hostname.endsWith(cnameRecord.data)) {
          console.log('  CNAME ' + cnameRecord.data + colors.green(' OK'));
        }
        else {
          console.log('  CNAME ' + cnameRecord.data + colors.red(' please remove this record'));
        }
      }

      if (cnameRecords.length === 0) {
        const isIncomplete = validateARecords(aRecords, expectedARecords);
        if (isIncomplete) {
          console.log('  CNAME ' + expectedCnameRecord + '.' + colors.yellow(' please remove all A records and use this CNAME record instead'));
        }
      }
    }
  }

}

function validateARecords (aRecords, expectedARecords) {
  let incomplete = false;
  for (const aRecord of aRecords) {
    if (expectedARecords.includes(aRecord)) {
      console.log('  A     ' + aRecord.padEnd(15, ' ') + colors.green(' OK'));
    }
    else {
      console.log('  A     ' + aRecord.padEnd(15, ' ') + colors.red(' this IP does not point to CC, maybe you are using a CDN'));
      incomplete = true;
    }
  }
  for (const aRecord of expectedARecords) {
    if (!aRecords.includes(aRecord)) {
      console.log('  A     ' + aRecord.padEnd(15, ' ') + colors.yellow(' please add this record'));
      incomplete = true;
    }
  }
  return incomplete;
}

async function diagAll (params) {

  const summary = await getSummary().then(sendToApi);
  const applications = [
    ...summary.user.applications.map((app) => [summary.user.id, app.id]),
    ...summary.organisations.flatMap((o) => o.applications.map((app) => [o.id, app.id])),
  ];

  for (const [ownerId, appId] of applications) {
    const app = await getApp({ id: ownerId, appId }).then(sendToApi);
    console.log(ownerId, appId);
    const domainMapping = app.vhosts.map((vh) => {
      const url = new URL('https://' + vh.fqdn);
      console.log('  ', url.hostname, url.pathname);
      // return { hostname: url.hostname, pathPrefix: url.pathname };
    });
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

function getRoutingConfig (vhosts) {
  return vhosts.map((vh) => {
    const url = new URL('https://' + vh.fqdn);
    return { hostname: url.hostname, pathPrefix: url.pathname };
  });
}

function sortRoutingConfig (routingConfig) {
  return routingConfig
    .slice()
    .sort((a, b) => {
      const reverseA = a.hostname.split('.').reverse().join('.');
      const reverseB = b.hostname.split('.').reverse().join('.');
      return reverseA.localeCompare(reverseB);
    });
}

async function resolveA (hostname) {
  const url = new URL('https://' + RESOLVERS.dnsEu);
  url.searchParams.set('name', hostname);
  url.searchParams.set('type', 'A');
  return fetch(url, {
    headers: {
      accept: 'application/dns-json',
    },
  })
    .then((r) => r.json())
    .then((records) => {
      // filter out a records coming from CNAME
      return records.Answer
        ?.filter(({ name }) => name === hostname)
        ?.map(({ data }) => data) ?? [];
    });
}

async function resolveCname (hostname) {
  const url = new URL('https://' + RESOLVERS.dnsEu);
  url.searchParams.set('name', hostname);
  url.searchParams.set('type', 'CNAME');
  return fetch(url, {
    headers: {
      accept: 'application/dns-json',
    },
  })
    .then((r) => r.json())
    .then((records) => {
      return records.Answer ?? [];
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}

module.exports = { list, add, getFavourite, setFavourite, unsetFavourite, rm, diagApplication, diagAll };
