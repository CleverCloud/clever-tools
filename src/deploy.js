var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var AppConfig = require("./models/app_configuration.js");
var Application = require("./models/application.js");
var Git = require("./models/git.js")(path.resolve("."));
var Log = require("./models/log.js");

var Logger = require("./logger.js");

var timeout = 5 * 60 * 1000;

var deploy = module.exports = function(api, params) {
  var alias = params.options.alias;
  var branch = params.options.branch;

  var s_appData = AppConfig.getAppData(alias);

  var s_remote = s_appData.flatMapLatest(function(app_data) {
    return Git.createRemote(app_data.alias, app_data.deploy_url).toProperty();
  });

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
