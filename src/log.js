var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("./models/application.js");
var Log = require("./models/log.js");

var Logger = require("./logger.js");

var appLogs = module.exports = function(api) {
  var yargs = appLogs.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var app_id = argv._[1];

  var s_logs = Log.getAppLogs(app_id, api.session.getAuthorization());

  s_logs.onValue(function(log) {
    Logger.println(log._source["@timestamp"] + ": ", log._source["@message"]);
  });
  s_logs.onError(Logger.error);
};

appLogs.usage = "Usage: $0 log <app-id>";
appLogs.yargs = function() {
  return require("yargs")
    .usage(appLogs.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .demand(2);
};
