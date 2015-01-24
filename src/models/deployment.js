var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var Deployment = module.exports;

Deployment.list = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.deployments.get().withParams(params).send();
};

Deployment.last = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.deployments.get().withParams(params).withQuery({ limit: 1 }).send();
};

Deployment.cancel = function(api, deployment, appId, orgaId) {
  var params;

  if(deployment.action === 'DEPLOY' && deployment.state === 'WIP') {
    params = orgaId ? [orgaId, appId, deployment.id] : [appId, deployment.id];

    return api.owner(orgaId).applications._.deployments._.instances.delete().withParams(params).send();
  } else {
    return new Bacon.Error('There is no ongoing deployment for this application');
  }
};
