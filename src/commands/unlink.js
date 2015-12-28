var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var unlink = module.exports = function(api, params) {
  var alias = params.args[0];

  var s_app = Application.unlinkRepo(api, alias);

  s_app.onValue(function(app) {
    Logger.println("Your application has been successfully unlinked!");
  });

  s_app.onError(Logger.error);
};
