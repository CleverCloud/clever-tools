var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./application.js");
var Logger = require("../logger.js");



var Domain = module.exports;

Domain.list = function(api, appId, orgaId) {
  var s_app = Application.get(api, appId, orgaId);

  return s_app.flatMap(function(app) { return app.vhosts; });
};

Domain.create = function(api, fqdn, appId, orgaId) {
  var params = orgaId ? [orgaId, appId, fqdn] : [appId, fqdn];

  return api.owner(orgaId).applications._.vhosts._.put().withParams(params).send();
};

Domain.remove = function(api, fqdn, appId, orgaId) {
  var params = orgaId ? [orgaId, appId, fqdn] : [appId, fqdn];

  return api.owner(orgaId).applications._.vhosts._.delete().withParams(params).send();
};
