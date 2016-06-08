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
  var params = orgaId ? [orgaId, appId, encodeURIComponent(fqdn)] : [appId, encodeURIComponent(fqdn)];

  return api.owner(orgaId).applications._.vhosts._.put().withParams(params).send();
};

Domain.remove = function(api, fqdn, appId, orgaId) {
  var params = orgaId ? [orgaId, appId, encodeURIComponent(fqdn)] : [appId, encodeURIComponent(fqdn)];

  return api.owner(orgaId).applications._.vhosts._.delete().withParams(params).send();
};

Domain.getBest = function(api, appId, orgaId) {
  Logger.debug("Trying to get the favourite vhost for " + appId);
  var params = orgaId ? [orgaId, appId] : [appId];
  var s_favourite =
     api.owner(orgaId).applications._.vhosts.favourite.get().withParams(params).send()
    .flatMapError(function(error) {
      if(error.id === 4021) {
        return new Bacon.Next(undefined);
      } else {
        return error;
      }
    });

  var s_vhost = s_favourite.flatMapLatest(function(favourite) {
    if(typeof favourite === 'undefined') {
      Logger.debug("No favourite vhost defined for " + appId + ", taking the first one");
      var s_all = api.owner(orgaId).applications._.vhosts.get().withParams(params).send();
      return s_all.map(function(vhosts) {
        var customVhosts = vhosts.find(function(vhost) { return !vhost.fqdn.match(/\.cleverapps\.io/); });
        var result = customVhosts || vhosts[0];

        if(result) {
          return new Bacon.Next(result);
        } else {
          return new Bacon.Error("Couldn't find a domain name");
        }
      })
    } else {
      return new Bacon.Next(favourite);
    }
  });

  return s_vhost;
}
