var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var link = module.exports = function(api, params) {
  var appId = params.args[0];
  var alias = params.options.alias;

  var s_app = Application.linkRepo(api, appId, alias);

  var s_appWithRemote = s_app.flatMapLatest(function(app) {
    return Git.createRemote(app.alias, app.deploy_url)
              .flatMapLatest(function() { return app; });
  });

  s_appWithRemote.onValue(function() {
    Logger.println("Your application has been successfully linked!");
  });

  s_appWithRemote.onError(Logger.error);
};
