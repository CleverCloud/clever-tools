var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Application = require("./models/application.js");
var Git = require("./models/git.js");

var debug = console.log.bind(console);
var error = _.partial(console.error.bind(console), "[ERROR]");

module.exports.add = function(api) {
  var argv = require("yargs")
    .usage("Usage: $0 app add <name> -t <type> [-r <region>]")
    .alias("t", "type")
    .alias("r", "region")
    .demand(3)
    .demand(["type"])
    .argv;

  var name = argv._[2];
  var region = argv.region || "par";

  var s_type = Application.getInstanceType(api, argv.type);

  var s_app = s_type.flatMapLatest(function(type) {
    return Application.create(api, name, type, region);
  });

  var s_remote = s_app.flatMapLatest(function(app) {
    return Git.createRemote("clever", app.deployUrl);
  });

  var s_fetch = s_remote.flatMapLatest(_.partial(Git.keepFetching, 300000));

  var s_push = s_fetch.flatMapLatest(Git.push);

  s_push.onValue(function() {
    console.log("Your code has been pushed to Clever-Cloud.");
  });
  s_push.onError(error);
};
