var _ = require("lodash");
var Bacon = require("baconjs");
var autocomplete = require("cliparse").autocomplete;
var colors = require("colors");

var Application = require("./application.js");
var Interact = require("./interact.js");
var Logger = require("../logger.js");



var Addon = module.exports;

Addon.listProviders = function(api) {
  var s_providers = api.products.addonproviders.get().send();
  return s_providers;
};

Addon.getProvider = function(api, providerName) {
  var s_providers = api.products.addonproviders.get().send();

  var s_provider = s_providers.flatMapLatest(function(providers) {
    var provider = _.find(providers, function(p) { return p.id == providerName })
    return provider || new Bacon.Error("invalid provider name");
  });

  return s_provider;
};

Addon.getAllForOrga = function(api, orgaId) {
  return api.owner(orgaId).addons.get().withParams(orgaId ? [orgaId] : []).send()
};

Addon.getAllForApp = function(api, orgaId, appId) {
  return api.owner(orgaId).applications._.addons.get().withParams(orgaId ? [orgaId, appId] : [appId]).send()
};

Addon.list = function(api, orgaId, appId, showAll) {
  var s_allAddons = Addon.getAllForOrga(api, orgaId);
  if(appId) {
    var s_myAddons = Addon.getAllForApp(api, orgaId, appId);
    if(showAll) {
      return s_allAddons.flatMapLatest(function(allAddons) {
        return s_myAddons.flatMapLatest(function(myAddons) {
          var myAddonIds = _.map(myAddons, 'id');
          return _.map(allAddons, function(addon) {
            if(_.includes(myAddonIds, addon.id)) {
              return _.assign({}, addon, { isLinked: true });
            } else {
              return addon;
            }
          });
        });
      });
    } else {
      return s_myAddons;
    }

  } else { // Not linked to a specific app, show everything
    return s_allAddons;
  }
};

Addon.createAndLink = function(api, name, providerName, plan, region, skipConfirmation, appData) {
  var s_creation = Addon.create(api, appData.org_id, name, providerName, plan, region, skipConfirmation);
  var s_link = s_creation.flatMapLatest(function(addon) {
    return Addon.link(api, appData.app_id, appData.org_id, { "addon_id": addon.id });
  });

  return s_link;
};

Addon.create = function(api, orgaId, name, providerName, planName, region, skipConfirmation) {
  var s_providers = api.products.addonproviders.get().send();

  var s_provider = s_providers.flatMapLatest(function(providers) {
    var provider = _.find(providers, function(p) { return p.id == providerName })
    if(!provider) return new Bacon.Error("invalid provider name");

    if(!_.includes(provider.regions, region)) return new Bacon.Error("invalid region name. Available regions: " + provider.regions.join(", "));

    return provider;
  });

  var s_plan = s_provider.flatMapLatest(function(provider) {
    var plan = _.find(provider.plans, function(p) { return p.slug == planName; });
    var availablePlans = _.map(provider.plans, "slug");
    return plan || new Bacon.Error("invalid plan name. Available plans: " + availablePlans.join(", "));
  });

  const s_confirmedPlan = s_plan.flatMapLatest(plan => {
    return Addon.performPreorder(api, orgaId, name, plan.id, providerName, region)
      .flatMapLatest(result => {
         if(result.totalTTC > 0 && !skipConfirmation) {
           result.lines.forEach(line => {
             Logger.println(`${line.description}\tVAT: ${line.VAT}%\tPrice: ${line.price}€`);
           });
           Logger.println("Total (without taxes): " + result.totalHT + "€");
           Logger.println(("Total (with taxes): " + result.totalTTC + "€").bold);
           const s_confirm = Interact.confirm(
             "You're about to pay " + result.totalTTC + "€, confirm? (yes or no) ",
             "No confirmation, aborting addon creation"
           );
           return s_confirm.map(_.constant(plan));
         } else {
           return Bacon.once(plan)
         }
      });
  });

  var s_creation = s_confirmedPlan.flatMapLatest(function(plan) {
    return Addon.performCreation(api, orgaId, name, plan.id, providerName, region);
  });

  return s_creation;
};

/**
* Generate a preview creation, to get access to the price that will be charged,
* as well as to verify that the payment methods are correctly configured
*/
Addon.performPreorder = function(api, orgaId, name, planId, providerId, region) {
  var params = orgaId ? [orgaId] : [];
  return api.owner(orgaId).addons.preorders.post().withParams(params).send(JSON.stringify({
    name: name,
    plan: planId,
    providerId: providerId,
    region: region
  }));
};

Addon.performCreation = function(api, orgaId, name, planId, providerId, region) {
  var params = orgaId ? [orgaId] : [];
  return api.owner(orgaId).addons.post().withParams(params).send(JSON.stringify({
    name: name,
    plan: planId,
    providerId: providerId,
    region: region
  }));
};

Addon.getByName = function(api, orgaId, addonName) {
  var s_addons;
  if(orgaId) {
    s_addons = api.owner(orgaId).addons.get().withParams([orgaId]).send();
  } else {
    s_addons = api.owner().addons.get().withParams().send();
  }

  return s_addons.flatMapLatest(function(addons) {
    var filtered_addons = _.filter(addons, function(addon) {
      return addon.name === addonName || addon.realId === addonName;
    });
    if(filtered_addons.length === 1) {
      return Bacon.once(filtered_addons[0]);
    } else if(filtered_addons.length === 0) {
      return Bacon.once(new Bacon.Error("Addon not found"));
    } else {
      return Bacon.once(new Bacon.Error("Ambiguous addon name"));
    }
  });
};

Addon.getId = function(api, orgaId, addonIdOrName) {
  if(addonIdOrName.addon_id) {
    return Bacon.once(addonIdOrName.addon_id);
  } else {
    return Addon.getByName(api, orgaId, addonIdOrName.addon_name).map(function(addon) {
      return addon.id;
    });
  }

};

Addon.link = function(api, appId, orgaId, addonIdOrName) {
  var s_addonId = Addon.getId(api, orgaId, addonIdOrName);

  return s_addonId.flatMapLatest(function(addonId) {
    var params = orgaId ? [orgaId, appId] : [appId];
    return api.owner(orgaId).applications._.addons.post().withParams(params).send(JSON.stringify(addonId));
  });
};

Addon.unlink = function(api, appId, orgaId, addonIdOrName) {
  var s_addonId = Addon.getId(api, orgaId, addonIdOrName);

  return s_addonId.flatMapLatest(function(addonId) {
    var params = orgaId ? [orgaId, appId, addonId] : [appId, addonId];
    return api.owner(orgaId).applications._.addons._.delete().withParams(params).send();
  });
};

Addon.delete = function(api, orgaId, addonIdOrName, skipConfirmation) {
  var s_addonId = Addon.getId(api, orgaId, addonIdOrName);
  return s_addonId.flatMapLatest(function(addonId) {
    var params = orgaId ? [orgaId, addonId] : [addonId];

    var confirmation = skipConfirmation
      ? Bacon.once()
      : Interact.confirm("Deleting the addon can't be undone, are you sure? ", "No confirmation, aborting addon deletion");

    return confirmation.flatMapLatest(function() {
      return api.owner(orgaId).addons._.delete().withParams(params).send();
    });
  });
};

Addon.rename = function(api, orgaId, addonIdOrName, newName) {
  var s_addonId = Addon.getId(api, orgaId, addonIdOrName);
  return s_addonId.flatMapLatest(function(addonId) {
    var params = orgaId ? [orgaId, addonId] : [addonId];
    return api.owner(orgaId).addons._.put().withParams(params).send(JSON.stringify({
      name: newName
    }));
  });
};

Addon.completeRegion = function() {
  return autocomplete.words(["eu", "us"]);
};

Addon.completePlan = function() {
  return autocomplete.words(["dev", "s", "m", "l", "xl", "xxl"]);
};
