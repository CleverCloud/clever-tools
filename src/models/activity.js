var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var Activity = module.exports;

Activity.list = function(api, appId, orgaId, showAll) {
  var params = [];
  if(orgaId) params.push(orgaId)
  params.push(appId);
  var query = showAll ? {} : { limit: 10 };

  return api.owner(orgaId).applications._.deployments.get()
    .withParams(params)
    .withQuery(query)
    .send();
};
