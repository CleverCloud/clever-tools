var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var Application = require("../models/application.js");

var link = module.exports = function(api, params) {
  var appIdOrName = params.args[0];
  var orgaIdOrName = params.options.org;
  var alias = params.options.alias;

  if(appIdOrName.app_id && orgaIdOrName) {
    Logger.warn("You've specified a unique application ID, organisation option will be ignored");
  }

  var s_app = Application.linkRepo(api, appIdOrName, orgaIdOrName, alias);

  s_app.onValue(function(app) {
    Logger.println("Your application has been successfully linked!");
  });

  s_app.onError(Logger.error);
};
