var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var Application = require("../models/application.js");

var create = module.exports = function(api, params) {
  var name = params.args[0];
  var orgaIdOrName = params.options.org;
  var alias = params.options.alias;
  var region = params.options.region;
  var github;

  if(params.options.github) {
    github = {
      "owner": params.options.github.split("/")[0],
      "name": params.options.github.split("/")[1]
    }
  }

  var s_type = Application.getInstanceType(api, params.options.type);

  var s_app = s_type
    .flatMapLatest(function(type) {
      return Application.create(api, name, type, region, orgaIdOrName, github);
    })
    .flatMapLatest(function(app) {
      return Application.linkRepo(api, { app_id: app.id }, null, alias, true);
    });

  s_app.onValue(function(app) {
    Logger.println("Your application has been successfully created!");
  });

  s_app.onError(Logger.error);
};
