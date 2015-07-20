var _ = require("lodash");
var Bacon = require("baconjs");
var autocomplete = require("cliparse").autocomplete;
var Promise = require("bluebird");

var Logger = require("../logger.js");

var AppConfiguration = require("./app_configuration.js");

var Application = module.exports;

Application.listAvailableTypes = function() {
  return autocomplete.words([
    "apache+php54",
    "apache+php55",
    "docker",
    "go",
    "java+maven",
    "java+play1",
    "java+war",
    "node",
    "python27",
    "ruby",
    "sbt",
    "static"
  ]);
};

Application.listAvailableZones = function() {
  return autocomplete.words([
    "par",
    "mtl"
  ]);
};

Application.listAvailableAliases = function() {
  var s_aliases = AppConfiguration.loadApplicationConf().map(function(conf) {
    return _.pluck(conf.apps, "alias");
  });

  return s_aliases.toPromise(Promise).then(autocomplete.words);
};

Application.getInstanceType = function(api, type) {
  var s_types = api.products.instances.get().send();

  return s_types.flatMapLatest(function(types) {
    var matchingTypes = _.filter(types, function(instanceType) {
      return instanceType.type == type;
    });

    var instanceType = _.sortBy(matchingTypes, "version").reverse()[0];
    return instanceType ? Bacon.once(instanceType) : new Bacon.Error(type + " type does not exist.");
  });
};

Application.create = function(api, name, instanceType, region, orgaId) {
  Logger.debug("Create the application…");
  var params = orgaId ? [orgaId] : [];

  return api.owner(orgaId).applications.post().withParams(params).send(JSON.stringify({
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

Application.getInstances = function(api, appId, orgaId) {
  Logger.debug("Get instances for the app: " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.instances.get().withParams(params).send();
};

Application.linkRepo = function(api, appId, orgaId, alias) {
  Logger.debug("Linking current repository to the app: " + appId);

  var s_app = Application.get(api, appId, orgaId);

  return s_app.flatMapLatest(function(appData) {
    return AppConfiguration.addLinkedApplication(appData, orgaId, alias);
  });
};

Application.unlinkRepo = function(api, alias) {
  Logger.debug("Unlinking current repository from the app: " + alias);

  return AppConfiguration.removeLinkedApplication(alias);
};

Application.stop = function(api, appId, orgaId) {
  Logger.debug("Stopping the app: " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.instances.delete().withParams(params).send();
};
