#! /usr/bin/env node

if(process.argv.indexOf("-v") >= 0 || process.argv.indexOf("--verbose") >= 0) {
  process.env["CLEVER_VERBOSE"] = "1";
}

var _ = require("lodash");
var cliparse = require("cliparse");

var Logger = require("../src/logger.js");

var lazyRequiref = function(path, name) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    s_api.onValue(function(api) {
      var module = require(path);
      args.unshift(api);
      if(name) {
        module[name].apply(this, args);
      } else {
        module.apply(this, args);
      }
    });
  };
};

var lazyRequire = function(path) {
  return function(name) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      s_api.onValue(function(api) {
        args.unshift(api);
        var module = require(path);
        module[name].apply(this, args);
      });
    };
  };
};

var lr = function(path) {
  return function(name) {
    return function() {
      var module = require(path);
      return module[name].apply(this, arguments);
    };
  };
};

var create = lazyRequiref("../src/commands/create.js");
var link = lazyRequiref("../src/commands/link.js");
var unlink = lazyRequiref("../src/commands/unlink.js");
var env = lazyRequire("../src/commands/env.js");
var log = lazyRequiref("../src/commands/log.js");
var login = lazyRequiref("../src/commands/login.js");
var deploy = lazyRequiref("../src/commands/deploy.js");
var cancelDeploy = lazyRequiref("../src/commands/cancel-deploy.js");
var domain = lazyRequire("../src/commands/domain.js");
var stop = lazyRequiref("../src/commands/stop.js");
var status = lazyRequiref("../src/commands/status.js");
var activity = lazyRequiref("../src/commands/activity.js");

var Application = lr("../src/models/application.js");

function run() {
  // ARGUMENTS
  var appNameArgument = cliparse.argument("app-name", { description: "Application name" });
  var appIdArgument = cliparse.argument("app-id", { description: "Application ID (or name, if unambiguous)" });
  var aliasArgument = cliparse.argument("app-alias", { description: "Application alias" });
  var envVariableName = cliparse.argument("variable-name", { description: "Name of the environment variable" });
  var envVariableValue = cliparse.argument("variable-value", { description: "Value of the environment variable" });
  var fqdnArgument = cliparse.argument("fqdn", { description: "Domain name of the Clever-Cloud application" });

  // OPTIONS
  var orgaOption = cliparse.option("orga", { aliases: ["o"], description: "Organisation ID" });
  var aliasCreationOption = cliparse.option("alias", {
      aliases: ["a"],
      metavar: "alias",
      description: "Short name for the application" });
  var aliasOption = cliparse.option("alias", {
      aliases: ["a"],
      metavar: "alias",
      description: "Short name for the application",
      complete: Application("listAvailableAliases") });
  var instanceTypeOption = cliparse.option("type", {
      aliases: ["t"],
      required: true,
      metavar: "type",
      description: "Instance type",
      complete: Application("listAvailableTypes") });
  var regionOption = cliparse.option("region", {
      aliases: ["r"],
      default: "par",
      metavar: "zone",
      description: "Region, can be 'par' for Paris or 'mtl' for Montreal",
      complete: Application("listAvailableZones") });
  var branchOption = cliparse.option("branch", { aliases: ["b"], default: "", description: "Branch to push (current branch by default)" });
  var verboseOption = cliparse.flag("verbose", { aliases: ["v"], description: "Verbose output" });
  var showAllOption = cliparse.flag("show-all", { description: "Show all activity" });
  var quietOption = cliparse.flag("quiet", { aliases: ["q"], description: "Don't show logs during deployment" });

  // CREATE COMMAND
  var appCreateCommand = cliparse.command("create", {
    description: "Create a Clever-Cloud application",
    args: [appNameArgument],
    options: [
      orgaOption,
      aliasCreationOption,
      instanceTypeOption,
      regionOption
    ]
  }, create);

  // LINK COMMAND
  var appLinkCommand = cliparse.command("link", {
    description: "Link this repo to an existing Clever-Cloud application",
    args: [appIdArgument],
    options: [
      aliasCreationOption
    ]
  }, link);

  // UNLINK COMMAND
  var appUnlinkCommand = cliparse.command("unlink", {
    description: "Unlink this repo from an existing Clever-Cloud application",
    args: [aliasArgument]
  }, unlink);

  // ENV COMMANDS
  var envSetCommand = cliparse.command("set", {
    description: "Add or update an environment variable named <variable-name> with the value <variable-value>",
    args: [
      envVariableName,
      envVariableValue
    ]
  }, env("set"));

  var envRemoveCommand = cliparse.command("rm", {
    description: "Remove an environment variable from a Clever-Cloud application",
    args: [
      envVariableName
    ]
  }, env("rm"));

  var envCommands = cliparse.command("env", {
    description: "Manage Clever-Cloud application environment",
    options: [
      aliasOption
    ],
    commands: [
      envSetCommand,
      envRemoveCommand
    ]
  }, env("list"));

  // LOG COMMAND
  var logCommand = cliparse.command("log", {
    description: "Fetch some application logs, continuously",
    options: [
      aliasOption
    ]
  }, log);

  // LOGIN COMMAND
  var loginCommand = cliparse.command("login", {
    description: "Login to Clever-Cloud"
  }, login);

  // CANCEL DEPLOY COMMAND
  var cancelDeployCommand = cliparse.command("cancel-deploy", {
    description: "Cancel an ongoing deployment on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, cancelDeploy);

  // DEPLOY COMMAND
  var deployCommand = cliparse.command("deploy", {
    description: "Deploy an application to Clever-Cloud",
    options: [
      aliasOption,
      branchOption,
      quietOption
    ]
  }, deploy);

  // DOMAIN COMMANDS
  var domainCreateCommand = cliparse.command("add", {
    description: "Add a domain name to a Clever-Cloud application",
    args: [
      fqdnArgument
    ]
  }, domain("add"));

  var domainRemoveCommand = cliparse.command("rm", {
    description: "Remove a domain name from a Clever-Cloud application",
    args: [
      fqdnArgument
    ]
  }, domain("rm"));

  var domainCommands = cliparse.command("domain", {
    description: "Manage Clever-Cloud application domain names",
    options: [
      aliasOption
    ],
    commands: [
      domainCreateCommand,
      domainRemoveCommand
    ]
  }, domain("list"));

  // STOP COMMAND
  var stopCommand = cliparse.command("stop", {
    description: "Stop a running application on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, stop);

  // STATUS COMMAND
  var statusCommand = cliparse.command("status", {
    description: "See the status of an application on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, status);

  // ACTIVITY COMMAND
  var activityCommand = cliparse.command("activity", {
    description: "Show last deployments of a Clever-Cloud application",
    options: [
      aliasOption,
      showAllOption
    ]
  }, activity);

  // CLI PARSER
  var cliParser = cliparse.cli({
    name: "clever",
    description: "CLI tool to manage Clever-Cloud data and products",
    version: "0.2.0",
    options: [ verboseOption ],
    commands: [
      appCreateCommand,
      appLinkCommand,
      appUnlinkCommand,
      envCommands,
      logCommand,
      loginCommand,
      cancelDeployCommand,
      deployCommand,
      domainCommands,
      stopCommand,
      statusCommand,
      activityCommand
    ]
  });

  cliparse.parse(cliParser);
}
var s_api = require("../src/models/api.js")();

s_api.onError(Logger.error.bind(console));
run();
