var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");



var Env = module.exports;

Env.list = function(api, appId, orgaId) {
  if(orgaId) {
    return api.organisations._.applications._.env.get().withParams([orgaId, appId]).send();
  } else {
    return api.owner().applications._.env.get().withParams([appId]).send();
  }
};

Env.create = function(api, name, value, appId, orgaId) {
  if(orgaId) {
    return api.organisations._.applications._.env._.put().withParams([orgaId, appId, name]).send(value);
  } else {
    return api.owner().applications._.env._.put().withParams([appId, name]).send(value);
  }
};

Env.remove = function(api, name, appId, orgaId) {
  if(orgaId) {
    return api.organisations._.applications._.env._.delete().withParams([orgaId, appId, name]).send();
  } else {
    return api.owner().applications._.env._.delete().withParams([appId, name]).send();
  }
};
