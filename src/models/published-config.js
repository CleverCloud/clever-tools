var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var PublishedConfig = module.exports;

PublishedConfig.list = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.exposed_env.get().withParams(params).send();
};

PublishedConfig.set = function(api, name, value, appId, orgaId) {
  return PublishedConfig.list(api, appId, orgaId).flatMapLatest(function(values) {
    var config = _.assign({}, values)
    config[name] = value;
    var pairs = _.toPairs(config);
    return PublishedConfig.bulkSet(api, pairs, appId, orgaId);
  });
};

PublishedConfig.remove = function(api, name, appId, orgaId) {
  return PublishedConfig.list(api, appId, orgaId).flatMapLatest(function(values) {
    var config = _.assign({}, values);
    delete config[name];
    var pairs = _.toPairs(config);
    return PublishedConfig.bulkSet(api, pairs, appId, orgaId);
  });
};

PublishedConfig.bulkSet = function(api, pairs, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];
  var payload = _.fromPairs(pairs);

  return api.owner(orgaId).applications._.exposed_env.put().withParams(params).send(JSON.stringify(payload));
};
