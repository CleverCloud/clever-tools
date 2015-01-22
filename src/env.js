var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("./logger.js");

var AppConfig = require("./models/app_configuration.js");
var Env = require("./models/env.js");
var Git = require("./models/git.js")(path.resolve("."));

var env = module.exports = function(api) {
  if(env.subcommands[process.argv[3]]) {
    env.subcommands[process.argv[3]](api);
  }
  else {
    _.each(env.subcommands, function(subcommand) {
      Logger.error(subcommand.usage);
    });
  }
};

env.subcommands = {};

var list = env.subcommands.list = function(api) {
  var yargs = list.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.list(api, appData.app_id, appData.org_id);
  });

  s_env.onValue(function(envs) {
    console.log(_.map(envs, function(x) {
      return x.name + "=" + x.value;
    }).join('\n'));
  });

  s_env.onError(Logger.error);
};

list.usage = "Usage: $0 env list [--alias=<alias>]";
list.yargs = function() {
  return require("yargs")
    .usage(env.subcommands.list.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .options("alias", {
      description: "Application alias"
    })
    .demand(1);
};

var create = env.subcommands.create = function(api) {
  var yargs = create.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var name = argv._[2];
  var value = argv._[3];

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.create(api, name, value, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    console.log("Your environment variable has been successfully saved");
  });

  s_env.onError(Logger.error);
};

create.usage = "Usage: $0 env create <name> <value> [--alias=<alias>]";
create.yargs = function() {
  return require("yargs")
    .usage(env.subcommands.create.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .options("alias", {
      description: "Application alias"
    })
    .demand(3);
};

var remove = env.subcommands.remove = function(api) {
  var yargs = remove.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var name = argv._[2];
  var value = argv._[3];

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_env = s_appData.flatMap(function(appData) {
    return Env.remove(api, name, appData.app_id, appData.org_id);
  });

  s_env.onValue(function() {
    console.log("Your environment variable has been successfully removed");
  });

  s_env.onError(Logger.error);
};

remove.usage = "Usage: $0 env remove <name> [--alias=<alias>]";
remove.yargs = function() {
  return require("yargs")
    .usage(env.subcommands.remove.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .options("alias", {
      description: "Application alias"
    })
    .demand(2);
};
