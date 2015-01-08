var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./models/application.js");
var Git = require("./models/git.js");
var Log = require("./models/log.js");

var Logger = require("./logger.js");

var timeout = 5 * 60 * 1000;

var push = module.exports = function(api) {
  var yargs = push.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var remote = argv._[1];
  var branch = argv.branch;

  var s_remote = Git.getRemote(remote).toProperty();

  var s_fetch = s_remote.flatMapLatest(function(remote) {
    return Git.keepFetching(timeout, remote);
  }).toProperty();

  var s_push = s_fetch.flatMapLatest(function(remote) {
    return Git.push(remote, branch);
  }).toProperty();

  s_push.onValue(function() {
    Logger.println("Your source code has been pushed to Clever-Cloud.");
  });

  var s_app = s_push
    .flatMapLatest(function() {
      return s_remote;
    })
    .flatMapLatest(function(remote) {
      Logger.debug("Fetch application information…")
      var appId = remote.url().replace(/^.*(app_.*)\.git$/, "$1");
      return Application.get(api, appId);
    });

  var s_logs = s_app.flatMapLatest(function(app) {
    Logger.debug("Fetch application logs…");
    return Log.getAppLogs(app.id, api.session.getAuthorization());
  });

  s_logs.onValue(function(log) {
    Logger.println(log._source["@timestamp"] + ": ", log._source["@message"]);
  });
  s_logs.onError(Logger.error);
};

push.usage = "Usage: $0 push <remote> [--branch <branch>]";
push.yargs = function() {
  return require("yargs")
    .usage(push.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .options("branch", {
      alias: "b",
      default: "master",
      description: "The branch to push"
    })
    .demand(2);
};
