var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Addon = require("../models/addon.js");

var colors = require("colors");

var addon = module.exports;

var list = addon.list = function(api, params) {
  var alias = params.options.alias;
  var showAll = params.options["show-all"];

  var s_appData = AppConfig.getAppData(alias);

  var s_addon = s_appData.flatMap(function(appData) {
    return Addon.list(api, appData.app_id, appData.org_id, showAll);
  });

  s_addon.onValue(function(addons) {
    var nameWidth = Math.max.apply(null,   _(addons).pluck("name").filter().pluck("length").value());
    var planWidth = Math.max.apply(null,   _(addons).pluck("plan").pluck("name").pluck("length").value());
    var regionWidth = Math.max.apply(null, _(addons).pluck("region").pluck("length").value());
    var typeWidth = Math.max.apply(null,   _(addons).pluck("provider").pluck("name").pluck("length").value());

    var renderLine = function(addon, showLinked) {
      return (showLinked && addon.isLinked ? '* ' : '  ') +
        '[' + _.padRight(addon.plan.name, planWidth) + ' ' +
              _.padRight(addon.provider.name, typeWidth) + '] ' +
              _.padRight(addon.region, regionWidth) + ' ' +
              _.padRight(addon.name, nameWidth).bold.green + ' ' +
              addon.id;
    };

    Logger.println(addons.map(function(addon) {
      return renderLine(addon, showAll);
    }).join('\n'));
  });

  s_addon.onError(Logger.error);
};

var create = addon.create = function(api, params) {
  var providerName = params.args[0];
  var name = params.args[1];
  var alias = params.options.alias;
  var plan = params.options.plan;
  var region = params.options.region;

  var s_appData = AppConfig.getAppData(alias);
  var s_result = s_appData.flatMap(function(appData) {
    return Addon.create(api, appData.app_id, appData.org_id, name, providerName, plan, region);
  });

  s_result.onValue(function(r) {
    Logger.println("Addon " + name + " sucessfully created and linked to the application");
  });
  s_result.onError(Logger.error);
};

var link = addon.link = function(api, params) {
  var alias = params.options.alias;
  var addonId = params.args[0];

  var s_appData = AppConfig.getAppData(alias);

  var s_result = s_appData.flatMap(function(appData) {
    return Addon.link(api, appData.app_id, appData.org_id, addonId);
  });

  s_result.onValue(function() {
    Logger.println("Addon " + addonId + " sucessfully linked");
  });
  s_result.onError(Logger.error);
};

var unlink = addon.unlink = function(api, params) {
  var alias = params.options.alias;
  var addonId = params.args[0];

  var s_appData = AppConfig.getAppData(alias);

  var s_result = s_appData.flatMap(function(appData) {
    return Addon.unlink(api, appData.app_id, appData.org_id, addonId);
  });

  s_result.onValue(function() {
    Logger.println("Addon " + addonId + " sucessfully unlinked");
  });
  s_result.onError(Logger.error);
};

var listProviders = addon.listProviders = function(api, params) {
  var s_providers = Addon.listProviders(api);

  s_providers.onValue(function(providers) {
    var idWidth = Math.max.apply(null, _(providers).pluck("id").pluck("length").value());
    var nameWidth = Math.max.apply(null, _(providers).pluck("name").pluck("length").value());
    _.each(providers, function(provider) {
       Logger.println(
         _.padRight(provider.id, idWidth).bold + ' ' +
         _.padRight(provider.name, nameWidth) + ' ' +
         provider.shortDesc
       );
    });
  });
  s_providers.onError(Logger.error);
};

var showProvider = addon.showProvider = function(api, params) {
  var providerName = params.args[0];

  var s_provider = Addon.getProvider(api, providerName);

  s_provider.onValue(function(provider) {

    Logger.println(provider.id.bold);
    Logger.println(provider.name + ': ' + provider.shortDesc);
    Logger.println();
    Logger.println("Available regions: " + provider.regions.join(", "));
    Logger.println();
    Logger.println("Available plans");

    _.each(provider.plans, function(plan) {
      Logger.println("Plan " + plan.slug.bold);
      _.each(_.sortBy(plan.features, "name"), function(f) {
        Logger.println("  " + f.name + ": " + f.value);
      });
    });
  });
  s_provider.onError(Logger.error);
};
