var _ = require("lodash");
var Bacon = require("baconjs");
var autocomplete = require("cliparse").autocomplete;
var Promise = require("bluebird");

var Logger = require("../logger.js");

var AppConfiguration = require("./app_configuration.js");
var Organisation = require("./organisation.js");

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

Application.listAvailableFlavors = function() {
  return [
    "pico",
    "nano",
    "XS",
    "S",
    "M",
    "L",
    "XL"
  ];
};

Application.getInstanceType = function(api, type) {
  var s_types = api.products.instances.get().send();

  return s_types.flatMapLatest(function(types) {
    var matchingTypes = _.filter(types, function(instanceType) {
      return instanceType.type == type || (instanceType.variant && instanceType.variant.slug == type);
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

var getApplicationByName = function(s_apps, name) {
  var s_app = s_apps.flatMapLatest(function(apps) {
    var filtered_apps = _.filter(apps, function(app) {
      return app.name === name;
    });
    if(filtered_apps.length === 1) {
      return Bacon.once(filtered_apps[0]);
    } else if(filtered_apps.length === 0) {
      return Bacon.once(new Bacon.Error("Application not found"));
    } else {
      return Bacon.once(new Bacon.Error("Ambiguous application name"));
    }
  });

  return s_app;
};

Application.getByName = function(api, name) {
  var components = name.split("/");
  if(components.length == 1) {
    var s_apps = api.owner().applications.get().send()
    return getApplicationByName(s_apps, components[0]);
  } else if(components.length == 2) {
    var s_org = Organisation.getByName(api, components[0]);
    var s_apps = s_org.flatMapLatest(function(org) {
      return api.owner(org.id).applications.get().withParams([org.id]).send();
    });
    return getApplicationByName(s_apps, components[1]);
  } else {
   return Bacon.once(new Bacon.Error("Invalid application name"));
  }
};

var appIdPattern = /^app_[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
var isAppId = function(str) {
  return appIdPattern.exec(str) !== null;
};

Application.get = function(api, appId, orgaId) {
  if(isAppId(appId)) {
    Logger.debug("Get information for the app: " + appId);
    var params = orgaId ? [orgaId, appId] : [appId];

    return api.owner(orgaId).applications._.get().withParams(params).send();
  } else {
    return Bacon.once(new Bacon.Error("Invalid application id"));
  }
};

Application.getInstances = function(api, appId, orgaId) {
  Logger.debug("Get instances for the app: " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.instances.get().withParams(params).send();
};

Application.linkRepo = function(api, appId, alias) {
  Logger.debug("Linking current repository to the app: " + appId);

  var s_app = Application.get(api, appId)
    .flatMapError(function() {return Application.getByName(api, appId)});

  return s_app.flatMapLatest(function(appData) {
    return AppConfiguration.addLinkedApplication(appData, alias);
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

Application.redeploy = function(api, appId, orgaId) {
  Logger.debug("Redeploying the app: " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.instances.post().withParams(params).send();
};

Application.mergeScalabilityParameters = function(scalabilityParameters, instance) {
  var flavors = Application.listAvailableFlavors();

  if (scalabilityParameters.minFlavor) {
    instance.minFlavor = scalabilityParameters.minFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor))
      instance.maxFlavor = instance.minFlavor;
  }
  if (scalabilityParameters.maxFlavor) {
    instance.maxFlavor = scalabilityParameters.maxFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor) &&
        scalabilityParameters.minFlavor == null)
      instance.minFlavor = instance.maxFlavor;
  }

  if (scalabilityParameters.minInstances) {
    instance.minInstances = scalabilityParameters.minInstances;
    if (instance.minInstances > instance.maxInstances)
      instance.maxInstances = instance.minInstances;
  }
  if (scalabilityParameters.maxInstances) {
    instance.maxInstances = scalabilityParameters.maxInstances;
    if (instance.minInstances > instance.maxInstances && scalabilityParameters.minInstances == null)
      instance.minInstances = instance.maxInstances;
  }
  return instance;
}

Application.setScalability = function(api, appId, orgaId, scalabilityParameters) {
  Logger.info("Scaling the app: " + appId);

  var s_app = Application.get(api, appId, orgaId).toProperty();
  var s_body = s_app.map(function(app) {
    var instance = _.clone(app.instance);

    instance.minFlavor = instance.minFlavor.name;
    instance.maxFlavor = instance.maxFlavor.name;

    instance = Application.mergeScalabilityParameters(scalabilityParameters, instance);

    return instance;
  });

  return s_body.flatMapLatest(function(instance) {
    var params = orgaId ? [orgaId, appId] : [appId];
    return api.owner(orgaId).applications._.put().withParams(params).send(JSON.stringify(instance));
  })
};
