'use strict';

const _ = require('lodash');

const Logger = require('../logger.js');
const { getAllDomains, getFavouriteDomain } = require('@clevercloud/client/cjs/api/application.js');
const { sendToApi } = require('../models/send-to-api.js');

async function getBest (appId, orgaId) {
  Logger.debug('Trying to get the favourite vhost for ' + appId);
  return getFavouriteDomain({ id: orgaId, appId }).then(sendToApi)
    .catch(async (e) => {

      if (e.status !== 404) {
        throw e;
      }

      Logger.debug('No favourite vhost defined for ' + appId + ', selecting the best one');
      const allDomains = await getAllDomains({ id: orgaId, appId }).then(sendToApi);
      const result = selectBest(allDomains);

      if (result == null) {
        throw new Error('Couldn\'t find a domain name');
      }

      return result;
    });
}

function selectBest (vhosts) {
  const customVhost = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.endsWith('.cleverapps.io');
  });
  const withoutDefaultDomain = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.match(/^app-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.cleverapps\.io$/);
  });
  return customVhost || withoutDefaultDomain || vhosts[0];
}

module.exports = { getBest, selectBest };
