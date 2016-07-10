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
      if(error.id === 4021) { // if no favourite is defined, it's not an error
        return new Bacon.Next(undefined);
      } else {
        return new Bacon.Error(error);
      }
    });

  var s_vhost = s_favourite.flatMapLatest(function(favourite) {
    if(typeof favourite === 'undefined') {
      Logger.debug("No favourite vhost defined for " + appId + ", selecting the best one");
      var s_all = api.owner(orgaId).applications._.vhosts.get().withParams(params).send();
      return s_all.map(function(vhosts) {
        var result = Domain.selectBest(vhosts);
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

Domain.selectBest = function(vhosts) {
  var withoutDefaultDomain = _.filter(vhosts, function(vhost) { return !vhost.fqdn.match(/^app-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.cleverapps\.io$/); });
  var customVhost = _.find(vhosts, function(vhost) { return !vhost.fqdn.match(/\.cleverapps\.io$/); });
  return customVhost || withoutDefaultDomain[0] || vhosts[0];
}
