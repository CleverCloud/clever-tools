var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var Env = module.exports;

Env.list = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.env.get().withParams(params).send();
};

Env.listFromAddons = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.addons.env.get().withParams(params).send();
};

Env.set = function(api, name, value, appId, orgaId) {
  var params = orgaId ? [orgaId, appId, name] : [appId, name];

  return api.owner(orgaId).applications._.env._.put().withParams(params).send(JSON.stringify(value));
};

Env.remove = function(api, name, appId, orgaId) {
  var params = orgaId ? [orgaId, appId, name] : [appId, name];

  return api.owner(orgaId).applications._.env._.delete().withParams(params).send();
};

Env.bulkSet = function(api, pairs, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];
  var payload = _.object(pairs);

  return api.owner(orgaId).applications._.env.put().withParams(params).send(JSON.stringify(payload));
};
