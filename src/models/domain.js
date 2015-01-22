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
  if(orgaId) {
    return api.organisations._.applications._.vhosts._.put().withParams([orgaId, appId, fqdn]).send();
  } else {
    return api.owner().applications._.vhosts._.put().withParams([appId, fqdn]).send();
  }
};

Domain.remove = function(api, fqdn, appId, orgaId) {
  if(orgaId) {
    return api.organisations._.applications._.vhosts._.delete().withParams([orgaId, appId, fqdn]).send();
  } else {
    return api.owner().applications._.vhosts._.delete().withParams([appId, fqdn]).send();
  }
};
