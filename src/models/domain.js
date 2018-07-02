'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');

const Application = require('./application.js');
const Logger = require('../logger.js');

function list (api, appId, orgaId) {
  return Application.get(api, appId, orgaId)
    .flatMap((app) => app.vhosts);
}

function create (api, fqdn, appId, orgaId) {
  const encodedFqdn = encodeURIComponent(fqdn);
  const params = orgaId ? [orgaId, appId, encodedFqdn] : [appId, encodedFqdn];
  return api.owner(orgaId).applications._.vhosts._.put().withParams(params).send();
}

function remove (api, fqdn, appId, orgaId) {
  const encodedFqdn = encodeURIComponent(fqdn);
  const params = orgaId ? [orgaId, appId, encodedFqdn] : [appId, encodedFqdn];
  return api.owner(orgaId).applications._.vhosts._.delete().withParams(params).send();
}

function getBest (api, appId, orgaId) {
  Logger.debug('Trying to get the favourite vhost for ' + appId);
  const params = orgaId ? [orgaId, appId] : [appId];

  const s_favouriteVhost = api.owner(orgaId).applications._.vhosts.favourite.get().withParams(params).send();
  return s_favouriteVhost
    .flatMapError((error) => {
      // if no favourite is defined, it's not an error
      if (error.id === 4021) {
        return new Bacon.Next(undefined);
      }
      return new Bacon.Error(error);
    })
    .flatMapLatest((favourite) => {
      if (favourite != null) {
        return new Bacon.Next(favourite);
      }
      Logger.debug('No favourite vhost defined for ' + appId + ', selecting the best one');
      const s_vHosts = api.owner(orgaId).applications._.vhosts.get().withParams(params).send();
      return s_vHosts.map((vhosts) => {
        const result = selectBest(vhosts);
        if (result) {
          return new Bacon.Next(result);
        }
        return new Bacon.Error(`Couldn't find a domain name`);
      });
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

module.exports = { list, create, remove, getBest, selectBest };
