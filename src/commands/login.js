var fs = require("fs");
var exec = require("child_process").exec;
var path = require("path");
var mkdirp = require("mkdirp");

var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");
var OpenBrowser = require("../open-browser.js");
var conf = require("../models/configuration.js");
var Interact = require("../models/interact.js");


function runCommand(command) {
  return Bacon.fromBinder(function(sink) {
    exec(command, function(error, stdout, stderr) {
      // Don't consider output in stderr as a blocking error because of
      // firefox
      if(error) {
        sink(new Bacon.Error(error));
      } else {
        sink(stdout);
      }
      sink(new Bacon.End());
    });

    return function(){};
  });
}



function getOAuthData() {
  Logger.debug("Ask for tokens…");
  var s_token = Interact.ask("Enter CLI token: ");
  var s_secret = s_token.flatMapLatest(_.partial(Interact.ask, "Enter CLI secret: "));

  return Bacon.combineTemplate({
    token: s_token,
    secret: s_secret
  });
}

function ensureConfigDir() {
  return Bacon.fromNodeCallback(
    mkdirp,
    path.dirname(conf.CONFIGURATION_FILE,
    { mode: parseInt('0700', 8) }));
}

function writeLoginConfig(oauthData) {
  Logger.debug("Write the tokens in the configuration file…")
  return ensureConfigDir()
    .flatMapLatest(
      Bacon.fromNodeCallback(
        _.partial(fs.writeFile, conf.CONFIGURATION_FILE, JSON.stringify(oauthData))));
}

var login = module.exports = function(api, params) {
  Logger.debug("Try to login to Clever Cloud…")
  var result = OpenBrowser.getCommand(conf.CONSOLE_TOKEN_URL)
    .flatMapLatest(function(command) { Logger.println("Check your browser to get your tokens…"); return OpenBrowser.run(command) })
    .flatMapLatest(getOAuthData)
    .flatMapLatest(writeLoginConfig)
    .map(conf.CONFIGURATION_FILE + " has been updated.");

  // Force process exit, otherwhise, it will be kept alive
  // because of the spawn() call (in src/open-browser.js)
  result.onValue(function(message){
    Logger.println(message);
    process.exit(0);
  });

  result.onError(function(error){
    Logger.error(error);
    process.exit(1);
  });
};
