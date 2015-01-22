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

AppConfiguration.ensureAppConfigDir = function() {
  var s_configDir = Bacon.fromNodeCallback(_.partial(fs.readFile, Config.APP_CONFIGURATION_DIR));
  var s_ensuredConfigDir = s_configDir.flatMapError(function(error) {
    if(error.code === 'ENOENT') {
      return Bacon.fromNodeCallback(_.partial(fs.mkdir, Config.APP_CONFIGURATION_DIR));
    } else {
      return Bacon.once(error);
    }
  });

  return s_ensuredConfigDir;
};

AppConfiguration.addLinkedApplication = function(appData, orgaId, alias) {
  var currentConfig = AppConfiguration.loadApplicationConf();
  var appEntry = {
    app_id: appData.id,
    deploy_url: appData.deployUrl,
    name: appData.name,
    alias: alias || unidecode(appData.name).replace(/[^a-zA-z0-9]/gi, "-").toLowerCase()
  };

  if(orgaId) appEntry.org_id = orgaId;

  var newConfig = currentConfig.flatMapLatest(function(config) {
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

  var savedFile = AppConfiguration.ensureAppConfigDir()
    .flatMapLatest(function(___) { return newConfig; })
    .flatMapLatest(function(config) {
      return Bacon.fromNodeCallback(_.partial(fs.writeFile, Config.APP_CONFIGURATION_FILE, JSON.stringify(config)));
    });

  return savedFile;
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
