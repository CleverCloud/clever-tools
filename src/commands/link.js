var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("./logger.js");

var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var link = module.exports = function(api, params) {
  var appId = params.args[0];
  var orga = params.options.orga;
  var alias = params.options.alias;

  var s_app = Application.linkRepo(api, appId, orga, alias);

  s_app.onValue(function(app) {
    console.log("Your application has been successfully linked!");
  });

  s_app.onError(Logger.error);
};
