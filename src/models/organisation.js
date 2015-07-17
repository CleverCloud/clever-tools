var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfiguration = require("./app_configuration.js");

var Organisation = module.exports;

Organisation.getByName = function(api, name) {
  var s_orgs = api.summary.get().send().map(".organisations");
  var s_org = s_orgs.flatMapLatest(function(orgs) {
    var filtered_orgs = _.filter(orgs, function(org) {
      return org.name === name;
    });
    if(filtered_orgs.length === 1) {
      return Bacon.once(filtered_orgs[0]);
    } else if(filtered_orgs.length === 0) {
      return Bacon.once(new Bacon.Error("Ambiguous organisation name"));
    } else {
      return Bacon.once(new Bacon.Error("Organisation not found"));
    }
  });

  return s_org;
};

