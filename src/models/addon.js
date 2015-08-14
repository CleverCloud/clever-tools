var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./application.js");
var Logger = require("../logger.js");



var Addon = module.exports;

Addon.list = function(api, appId, orgaId, showAll) {
  var params = orgaId ? [orgaId, appId] : [appId];

  var s_myAddons =  api.owner(orgaId).applications._.addons.get().withParams(params).send();

  var s_enrichedAddons = s_myAddons.flatMapLatest(function(myAddons) {
    return api.owner(orgaId).addons.get().withParams(params).send()
          .map(function(allAddons) {
            return allAddons.map(function(a) {
              a.isLinked = _.pluck(myAddons, "id").indexOf(a.id) >= 0;
              return a;
            });
          });
  });

  return s_enrichedAddons.map(function(addons) {
    return addons.filter(function(a) {
      return showAll || a.isLinked;
    });
  });
};

