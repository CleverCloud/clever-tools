var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("./logger.js");

var AppConfig = require("./models/app_configuration.js");
var Domain = require("./models/domain.js");
var Git = require("./models/git.js")(path.resolve("."));

var domain = module.exports;

var list = domain.list = function(api, params) {
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.list(api, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function(domains) {
    console.log(_.pluck(domains, 'fqdn').join('\n'));
  });

  s_domain.onError(Logger.error);
};

var create = domain.create = function(api, params) {
  var fqdn = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.create(api, fqdn, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function() {
    console.log("Your domain has been successfully saved");
  });

  s_domain.onError(Logger.error);
};

var remove = domain.remove = function(api, params) {
  var fqdn = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.remove(api, fqdn, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function() {
    console.log("Your domain has been successfully removed");
  });

  s_domain.onError(Logger.error);
};
