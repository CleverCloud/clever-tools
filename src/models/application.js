var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfiguration = require("./app_configuration.js");

var Application = module.exports;

Application.getInstanceType = function(api, type) {
  var s_types = api.products.instances.get().send();

  return s_types.flatMapLatest(function(types) {
    var instanceType = _.find(types, function(instanceType) {
      return instanceType.type == type;
    });

    return instanceType ? Bacon.once(instanceType) : new Bacon.Error(type + " type does not exist.");
  });
};

Application.create = function(api, name, instanceType, region) {
  Logger.debug("Create the application…");
  return api.owner().applications.post().send(JSON.stringify({
    "deploy": "git",
    "description": name,
    "instanceType": instanceType.type,
    "instanceVersion": instanceType.version,
    "maxFlavor": "S",
    "maxInstances": 1,
    "minFlavor": "S",
    "minInstances": 1,
    "name": name,
    "zone": region
  }));
};

Application.get = function(api, appId, orgaId) {
  Logger.debug("Get information for the app: " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.get().withParams(params).send();
};

Application.linkRepo = function(api, appId, orgaId) {
  Logger.debug("Linking current repository to the app: " + appId);

  var s_app = Application.get(api, appId, orgaId);

  return s_app.flatMapLatest(function(appData) {
    return AppConfiguration.addLinkedApplication(appData, orgaId);
  });
};
