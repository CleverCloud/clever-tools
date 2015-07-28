var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var unidecode = require("unidecode");

var Config = require("./configuration.js");
var Logger = require("../logger.js");

var AppConfiguration = module.exports = {};

AppConfiguration.loadApplicationConf = function() {
  Logger.debug("Loading app configuration from " + Config.APP_CONFIGURATION_FILE);
  var s_appData = Bacon.fromNodeCallback(_.partial(fs.readFile, Config.APP_CONFIGURATION_FILE)).flatMapLatest(function(content) {
    try {
      return Bacon.once(JSON.parse(content));
    }
    catch(e) {
      return new Bacon.Error(e);
    }
  });

  return s_appData.mapError(function(error) {
    Logger.warn("Cannot load app configuration from " + Config.APP_CONFIGURATION_FILE + " (" + error + ")");
    return { apps: [] };
  });
};

AppConfiguration.addLinkedApplication = function(appData, alias) {
  var currentConfig = AppConfiguration.loadApplicationConf();
  var appEntry = {
    app_id: appData.id,
    deploy_url: appData.deployUrl,
    name: appData.name,
    alias: alias || unidecode(appData.name).replace(/[^a-zA-z0-9]+/gi, "-").toLowerCase()
  };

  if(appData.ownerId.substr(0,5) === "orga_") appEntry.org_id = appData.ownerId;

  var s_newConfig = currentConfig.flatMapLatest(function(config) {
    var isPresent = !_.find(config.apps, function(app) {
      return app.app_id === appEntry.app_id;
    });

    // ToDo see what to do when there is a conflict between an existing entry
    // and the entry we want to add (same app_id, different other values)
    if(isPresent) {
      config.apps.push(appEntry);
    }
    return config;
  });

  return s_newConfig.flatMapLatest(AppConfiguration.persistConfig);
};

AppConfiguration.removeLinkedApplication = function(alias) {
  var currentConfig = AppConfiguration.loadApplicationConf();

  var s_newConfig = currentConfig.flatMapLatest(function(config) {
    config.apps = _.reject(config.apps, function(appEntry) {
      return appEntry.alias === alias;
    });
    return config;
  });

  return s_newConfig.flatMapLatest(AppConfiguration.persistConfig);
};

AppConfiguration.getAppData = function(alias) {
  var currentConfig = AppConfiguration.loadApplicationConf();

  return currentConfig.flatMap(function(config) {
    var matchingApps = _.filter(config.apps, function(app) { return app.alias === alias; });

    if(!alias && config.apps.length === 1) {
      return Bacon.once(config.apps[0]);
    } else if(matchingApps.length === 1) {
      return Bacon.once(matchingApps[0]);
    } else if(matchingApps.length === 0) {
      return new Bacon.Error("no matching application");
    } else if(matchingApps.length > 1) {
      return new Bacon.Error("multiple matching applications");
    }
  });
};

AppConfiguration.persistConfig = function(modifiedConfig) {
  var savedFile = Bacon.fromNodeCallback(_.partial(fs.writeFile, Config.APP_CONFIGURATION_FILE, JSON.stringify(modifiedConfig)));

  return savedFile;
};
