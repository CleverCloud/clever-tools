var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

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

  if(orgaId) {
    return api.organisations._.get().withParams([orgaId]).send()
      .map(function(organisation) {
        return _.find(organisation.apps, function(app) {
          return app.id === appId;
        });
      });
  } else {
    return api.owner().applications._.get().withParams([appId]).send();
  }
};
