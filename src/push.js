var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./models/application.js");
var Git = require("./models/git.js");
var Log = require("./models/log.js");

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

  var s_remote = Git.getRemote(remote).toProperty();

  var s_fetch = s_remote.flatMapLatest(function(remote) {
    return Git.keepFetching(timeout, remote);
  }).toProperty();

  var s_push = s_fetch.flatMapLatest(function(remote) {
    return Git.push(remote, branch);
  }).toProperty();

  s_push.onValue(function() {
    console.log("Your source code has been pushed to Clever-Cloud.");
  });

  var s_app = s_push
    .flatMapLatest(function() {
      return s_remote;
    })
    .flatMapLatest(function(remote) {
      debug("Fetch application information…")
      var appId = remote.url().replace(/^.*(app_.*)\.git$/, "$1");
      return Application.get(api, appId);
    });

  var s_logs = s_app.flatMapLatest(function(app) {
    debug("Fetch application logs…");
    return Log.getAppLogs(app.id, api.session.getAuthorization());
  });

  s_logs.onValue(function(log) {
    console.log(log._source["@timestamp"] + ": ", log._source["@message"]);
  });
  s_logs.onError(error);
};
