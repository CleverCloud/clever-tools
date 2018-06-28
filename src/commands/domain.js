var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var handleCommandStream = require('../command-stream-handler');
var AppConfig = require("../models/app_configuration.js");
var Domain = require("../models/domain.js");
var Git = require("../models/git.js")(path.resolve("."));

var domain = module.exports;

var list = domain.list = function(api, params) {
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.list(api, appData.app_id, appData.org_id);
  });

  handleCommandStream(s_domain, domains => Logger.println(_.map(domains, 'fqdn').join('\n')));
};

var add = domain.add = function(api, params) {
  var fqdn = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.create(api, fqdn, appData.app_id, appData.org_id);
  });

  handleCommandStream(s_domain, () => Logger.println("Your domain has been successfully saved"));
};

var rm = domain.rm = function(api, params) {
  var fqdn = params.args[0];
  var alias = params.options.alias;

  var s_appData = AppConfig.getAppData(alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.remove(api, fqdn, appData.app_id, appData.org_id);
  });

  handleCommandStream(s_domain, () => Logger.println("Your domain has been successfully removed"));
};
