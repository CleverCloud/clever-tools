'use strict';

const Bacon = require('baconjs');

function list (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.deployments.get().withParams(params).send();
};

function last (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.deployments.get().withParams(params).withQuery({ limit: 1 }).send();
};

function cancel (api, deployment, appId, orgaId) {
  if (deployment.action === 'DEPLOY' && deployment.state === 'WIP') {
    const params = orgaId ? [orgaId, appId, deployment.id] : [appId, deployment.id];
    return api.owner(orgaId).applications._.deployments._.instances.delete().withParams(params).send();
  }
  return new Bacon.Error('There is no ongoing deployment for this application');
};

module.exports = { list, last, cancel };
