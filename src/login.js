var fs = require("fs");
var exec = require("child_process").exec;
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("./logger.js");
var conf = require("./models/configuration.js");

function getOpenCommand() {
  Logger.debug("Get the right command to open a tab in a browser…")
  switch(process.platform) {
    case "darwin":
      return Bacon.constant("open " + conf.CONSOLE_TOKEN_URL);
    case "linux":
      return Bacon.constant("xdg-open" + conf.CONSOLE_TOKEN_URL);
    default:
      return new Bacon.Error("Unsupported platform: " + process.platform);
  }
}

function runCommand(command) {
  Logger.debug("Open the token management page in a browser…")
  return Bacon.fromBinder(function(sink) {
    exec(command, function(error, stdout, stderr) {
      if(error || stderr) {
        sink(new Bacon.Error(error || stderr));
      }
      else {
        sink(stdout);
      }
      sink(new Bacon.End());
    });

    return function(){};
  });
}

function ask(question) {
  var readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return Bacon.fromCallback(_.partial(readline.question.bind(readline), question)).doAction(readline.close.bind(readline));
}

function getOAuthData() {
  Logger.debug("Ask for tokens…");
  var s_token = ask("Enter CLI token: ");
  var s_secret = s_token.flatMapLatest(_.partial(ask, "Enter CLI secret: "));

  return Bacon.combineTemplate({
    token: s_token,
    secret: s_secret
  });
}

function writeLoginConfig(oauthData) {
  Logger.debug("Write the tokens in the configuration file…")
  return Bacon.fromNodeCallback(_.partial(fs.writeFile, conf.CONFIGURATION_FILE, JSON.stringify(oauthData)));
}
 
var login = module.exports = function(api) {
  var yargs = login.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  Logger.debug("Try to login to Clever-Cloud…")
  var result = getOpenCommand()
    .flatMapLatest(runCommand)
    .flatMapLatest(getOAuthData)
    .flatMapLatest(writeLoginConfig)
    .map(conf.CONFIGURATION_FILE + " has been updated.");
  
  result.onValue(Logger.println);
  result.onError(Logger.error);
};

login.usage = "Usage: $0 login";
login.yargs = function() {
  return require("yargs")
    .usage(login.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    });
};