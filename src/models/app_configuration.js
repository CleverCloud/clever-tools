var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var unidecode = require("unidecode");

var Config = require("./configuration.js");
var Logger = require("../logger.js");

var AppConfiguration = module.exports = {};

AppConfiguration.loadApplicationConf = function(pathToFolder) {
  if(typeof pathToFolder == "undefined") {
    pathToFolder = path.dirname(Config.APP_CONFIGURATION_FILE);
  }
  var fileName = path.basename(Config.APP_CONFIGURATION_FILE);
  var fullPath = path.join(pathToFolder, fileName)
  Logger.debug("Loading app configuration from " + fullPath);
  var s_appData = Bacon.fromNodeCallback(_.partial(fs.readFile, fullPath)).flatMapLatest(function(content) {
    try {
      return Bacon.once(JSON.parse(content));
    }
    catch(e) {
      return new Bacon.Error(e);
    }
  });

  return s_appData.flatMapError(function(error) {
    Logger.info("Cannot load app configuration from " + Config.APP_CONFIGURATION_FILE + " (" + error + ")");
    if(path.parse(pathToFolder).root == pathToFolder) {
      return { apps: [] };
    } else {
      return AppConfiguration.loadApplicationConf(path.normalize(path.join(pathToFolder, "..")));
    }
  });
};

AppConfiguration.addLinkedApplication = function(appData, alias) {
  var currentConfig = AppConfiguration.loadApplicationConf();
  var appEntry = {
    app_id: appData.id,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
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
    var matchingApps = _.filter(config.apps, function(app) {
      var nothingMatches = !alias && !config.default;
      var aliasMatches = alias && app.alias === alias;
      var isDefault = !alias && app.app_id == config.default;
      return nothingMatches || aliasMatches || isDefault;
    });

    if(matchingApps.length === 1) {
      return Bacon.once(matchingApps[0]);
    } else if(matchingApps.length === 0) {
      if(alias) {
        return new Bacon.Error("There are no applications matching this alias");
      } else {
        return new Bacon.Error("There are no applications linked. You can add one with `clever link`");
      }
    } else if(matchingApps.length > 1) {
      return new Bacon.Error("Several applications are linked. You can specify one with the `--alias` option. Run `clever applications` to list linked applications. Available aliases: " + _.map(matchingApps, "alias").join(", "));
    }
  });
};

AppConfiguration.persistConfig = function(modifiedConfig) {
  var savedFile = Bacon.fromNodeCallback(_.partial(fs.writeFile, Config.APP_CONFIGURATION_FILE, JSON.stringify(modifiedConfig)));

  return savedFile;
};

AppConfiguration.setDefault = function(alias) {
  var s_currentConfig = AppConfiguration.loadApplicationConf();

  var s_newConfig = s_currentConfig.flatMap(function(config) {
    var app = _.find(config.apps, function(app) {
      return app.alias === alias
    });

    if(app) {
      return _.assign({}, config, { default: app.app_id });
    } else {
      return new Bacon.Error("There is no application with this alias");
    }
  });

  return s_newConfig.flatMapLatest(AppConfiguration.persistConfig);
}
