var _ = require("lodash");
var Logger = require("./logger.js");

function run(api) {
  var commands = {};

  var app = commands.app = require("./app.js");
  var login = commands.login = require("./login.js");
  var push = commands.push = require("./push.js");

  if(commands[process.argv[2]]) {
    commands[process.argv[2]](api);
  }
  else {
    Logger.error("Unknown command:", process.argv[2], "\n");
    _.each(commands, function(command, name) {
      if(command.usage) {
        Logger.error(command.usage);
      }
      _.each(command.subcommands, function(subcommand, name) {
        Logger.error(subcommand.usage);
      });
    });
  }
}

var s_api = require("./models/api.js")();
s_api.onValue(run);
s_api.onError(Logger.error.bind(console));
