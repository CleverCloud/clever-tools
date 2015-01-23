var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("./logger.js");

var Application = require("./models/application.js");
var Git = require("./models/git.js")(path.resolve("."));

var app = module.exports;

var create = app.create = function(api, params) {
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
      return Application.linkRepo(api, app.id, orga);
    });

  s_app.onValue(function(app) {
    console.log("Your application has been successfully created!");
  });

  s_app.onError(Logger.error);
};

var link = app.link = function(api, params) {
  var appId = params.args[0];
  var orga = params.options.orga;
  var alias = params.options.alias;

  var s_app = Application.linkRepo(api, appId, orga, alias);

  s_app.onValue(function(app) {
    console.log("Your application has been successfully linked!");
  });

  s_app.onError(Logger.error);
};

var unlink = app.unlink = function(api, params) {
  var alias = params.args[0];

  var s_app = Application.unlinkRepo(api, alias);

  s_app.onValue(function(app) {
    console.log("Your application has been successfully unlinked!");
  });

  s_app.onError(Logger.error);
};
