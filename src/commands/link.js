var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var handleCommandStream = require('../command-stream-handler');
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


  handleCommandStream(s_app, app => Logger.println("Your application has been successfully linked!"));
};
