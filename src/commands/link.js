var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var link = module.exports = function(api, params) {
  var appIdOrName = params.args[0];
  var orgaIdOrName = params.options.org;
  var alias = params.options.alias;

  if(appIdOrName.app_id && orgaIdOrName) {
    Logger.warn("You've specified a unique application ID, organisation option will be ignored");
  }

  var s_app = Application.linkRepo(api, appIdOrName, orgaIdOrName, alias);

  var s_appWithRemote = s_app.flatMapLatest(function(app) {
    return Git.createRemote(app.alias, app.deploy_url)
              .flatMapLatest(function() { return app; });
  });

  s_appWithRemote.onValue(function() {
    Logger.println("Your application has been successfully linked!");
  });

  s_appWithRemote.onError(Logger.error);
};
