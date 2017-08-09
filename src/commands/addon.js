var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Addon = require("../models/addon.js");
var Organisation = require("../models/organisation.js");

var colors = require("colors");

var addon = module.exports;

var list = addon.list = function(api, params) {
  var orgaIdOrName = params.options.org;
  var s_orgaId = Organisation.getId(api, orgaIdOrName);

  var s_addons = s_orgaId.flatMapLatest(function(orgaId) {
    return Addon.list(api, orgaId);
  });

  s_addons.onValue(function(addons) {
    var nameWidth = Math.max.apply(null,   _(addons).map("name").filter().map("length").value());
    var planWidth = Math.max.apply(null,   _(addons).map("plan").map("name").map("length").value());
    var regionWidth = Math.max.apply(null, _(addons).map("region").map("length").value());
    var typeWidth = Math.max.apply(null,   _(addons).map("provider").map("name").map("length").value());

    var renderLine = function(addon) {
      return '[' + _.padEnd(addon.plan.name, planWidth) + ' ' +
                   _.padEnd(addon.provider.name, typeWidth) + '] ' +
                   _.padEnd(addon.region, regionWidth) + ' ' +
                   _.padEnd(addon.name, nameWidth).bold.green + ' ' +
                   addon.id;
    };

    Logger.println(
      addons.map(renderLine)
            .join('\n'));
  });

  s_addons.onError(Logger.error);
};

var create = addon.create = function(api, params) {
  var providerName = params.args[0];
  var name = params.args[1];
  var linkTo = params.options.link;
  var plan = params.options.plan;
  var region = params.options.region;
  var skipConfirmation = params.options.yes;
  var orgaIdOrName = params.options.org;

  var s_orgaId = Organisation.getId(api, orgaIdOrName);

  var s_result = s_orgaId.flatMapLatest(function(orgaId) {
    if(linkTo) {
      return AppConfig.getAppData(linkTo).flatMapLatest(function(appData) {
        if(orgaIdOrName && appData.orgaId !== orgaId) {
          Logger.warn("The specified application does not belong to the specified organisation. Ignoring the `--org` option");
        }
        return Addon.createAndLink(api, name, providerName, plan, region, skipConfirmation, appData);
      });
    } else {
      return Addon.create(api, orgaId, name, providerName, plan, region, skipConfirmation);
    }
  });

  s_result.onValue(function(r) {
    if(linkTo) {
      Logger.println("Addon " + name + " (id:" + r.id +") successfully created and linked to the application");
    } else {
      Logger.println("Addon " + name + " (id:" + r.id +") successfully created");
    }
  });
  s_result.onError(Logger.error);
};

var adelete = addon.delete = function(api, params) {
  var skipConfirmation = params.options.yes;
  var addonIdOrName = params.args[0];
  var orgaIdOrName = params.options.org;

  var s_orgaId = Organisation.getId(api, orgaIdOrName);

  var s_result = s_orgaId.flatMap(function(orgaId) {
    return Addon.delete(api, orgaId, addonIdOrName, skipConfirmation);
  });

  s_result.onValue(function() {
    Logger.println("Addon " + (addonIdOrName.addon_id || addonIdOrName.addon_name) + " successfully deleted");
  });
  s_result.onError(Logger.error);
};

var rename = addon.rename = function(api, params) {
  var addonIdOrName = params.args[0];
  var newName = params.args[1];
  var orgaIdOrName = params.options.org;

  var s_result = Organisation.getId(api, orgaIdOrName).flatMap(function(orgaId) {
    return Addon.rename(api, orgaId, addonIdOrName, newName);
  });

  s_result.onValue(function() {
    Logger.println("Addon " + (addonIdOrName.addon_id || addonIdOrName.addon_name) + " successfully renamed to " + newName);
  });
  s_result.onError(Logger.error);
};

var listProviders = addon.listProviders = function(api, params) {
  var s_providers = Addon.listProviders(api);

  s_providers.onValue(function(providers) {
    var idWidth = Math.max.apply(null, _(providers).map("id").map("length").value());
    var nameWidth = Math.max.apply(null, _(providers).map("name").map("length").value());
    _.each(providers, function(provider) {
       Logger.println(
         _.padEnd(provider.id, idWidth).bold + ' ' +
         _.padEnd(provider.name, nameWidth) + ' ' +
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
