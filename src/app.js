var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Application = require("./models/application.js");
var Git = require("./models/git.js");

var debug = console.log.bind(console);
var error = _.partial(console.error.bind(console), "[ERROR]");

module.exports.create = function(api) {
  var argv = require("yargs")
    .usage("Usage: $0 app create <name> -t <type> [-r <region>] [--remote <remote>]")
    .alias("t", "type")
    .alias("r", "region")
    .demand(3)
    .demand(["type"])
    .argv;

  var name = argv._[2];
  var region = argv.region || "par";
  var remote = argv.remote || "clever";

  var s_type = Application.getInstanceType(api, argv.type);

  var s_app = s_type.flatMapLatest(function(type) {
    return Application.create(api, name, type, region).flatMapLatest(function(app) {
      return Git.createRemote(remote, app.deployUrl).map(app);
    });
  });

  s_app.onValue(function(app) {
    console.log("Your application has been successfully created!");
  });

  s_app.onError(error);
};
