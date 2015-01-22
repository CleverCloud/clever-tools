var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("./logger.js");

var AppConfig = require("./models/app_configuration.js");
var Domain = require("./models/domain.js");
var Git = require("./models/git.js")(path.resolve("."));

var domain = module.exports = function(api) {
  if(domain.subcommands[process.argv[3]]) {
    domain.subcommands[process.argv[3]](api);
  }
  else {
    _.each(domain.subcommands, function(subcommand) {
      Logger.printErrorLine(subcommand.usage);
    });
  }
};

domain.subcommands = {};

var list = domain.subcommands.list = function(api) {
  var yargs = list.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.list(api, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function(domains) {
    console.log(_.pluck(domains, 'fqdn').join('\n'));
  });

  s_domain.onError(Logger.error);
};

list.usage = "Usage: $0 domain list [--alias=<alias>]";
list.yargs = function() {
  return require("yargs")
    .usage(domain.subcommands.list.usage)
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

var create = domain.subcommands.create = function(api) {
  var yargs = create.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var fqdn = argv._[2];

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.create(api, fqdn, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function() {
    console.log("Your domain has been successfully saved");
  });

  s_domain.onError(Logger.error);
};

create.usage = "Usage: $0 domain create <fqdn> [--alias=<alias>]";
create.yargs = function() {
  return require("yargs")
    .usage(domain.subcommands.create.usage)
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

var remove = domain.subcommands.remove = function(api) {
  var yargs = remove.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var fqdn = argv._[2];

  var s_appData = AppConfig.getAppData(argv.alias);

  var s_domain = s_appData.flatMap(function(appData) {
    return Domain.remove(api, fqdn, appData.app_id, appData.org_id);
  });

  s_domain.onValue(function() {
    console.log("Your domain has been successfully removed");
  });

  s_domain.onError(Logger.error);
};

remove.usage = "Usage: $0 domain remove <fqdn> [--alias=<alias>]";
remove.yargs = function() {
  return require("yargs")
    .usage(domain.subcommands.remove.usage)
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
