var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./models/application.js");
var Git = require("./models/git.js");

var debug = console.log.bind(console);
var error = _.partial(console.error.bind(console), "[ERROR]");

var timeout = 5 * 60 * 1000;

module.exports = function(api) {
  var argv = require("yargs")
    .usage("Usage: $0 push <remote> [--branch <branch>]")
    .alias("b", "branch")
    .demand(2)
    .argv;

  var remote = argv._[1];
  var branch = argv.branch || "master";

  var s_remote = Git.getRemote(remote);

  var s_fetch = s_remote.flatMapLatest(function(remote) {
    return Git.keepFetching(timeout, remote);
  });

  var s_push = s_fetch.flatMapLatest(function(remote) {
    return Git.push(remote, branch);
  });

  s_push.onValue(function() {
    console.log("Your source code has been pushed to Clever-Cloud.");
  });
  s_push.onError(error);
};
