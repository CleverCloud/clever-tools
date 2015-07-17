var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

var create = module.exports = function(api, params) {
  var name = params.args[0];
  var orga = params.options.orga;
  var alias = params.options.alias;
  var region = params.options.region;

  var s_type = Application.getInstanceType(api, params.options.type);

  var s_app = s_type
    .flatMapLatest(function(type) {
      return Application.create(api, name, type, region, orga);
    })
    .flatMapLatest(function(app) {
      return Application.linkRepo(api, app.id);
    });

  s_app.onValue(function(app) {
    console.log("Your application has been successfully created!");
  });

  s_app.onError(Logger.error);
};
