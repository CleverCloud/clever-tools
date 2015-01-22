var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var Activity = module.exports;

Activity.list = function(api, appId, orgaId) {
  var params = orgaId ? [orgaId, appId] : [appId];

  return api.owner(orgaId).applications._.deployments.get().withParams(params).send();
};
