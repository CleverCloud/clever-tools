var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var handleCommandStream = require('../command-stream-handler');
var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));

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

  handleCommandStream(s_app, () => Logger.println("Your application has been successfully created!"));
};
