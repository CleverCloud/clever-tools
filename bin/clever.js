#! /usr/bin/env node

if(process.argv.indexOf("-v") >= 0 || process.argv.indexOf("--verbose") >= 0) {
  process.env["CLEVER_VERBOSE"] = "1";
}

var _ = require("lodash");
var cliparse = require("cliparse");

var Logger = require("../src/logger.js");

var create = require("../src/commands/create.js");
var link = require("../src/commands/link.js");
var unlink = require("../src/commands/unlink.js");
var env = require("../src/commands/env.js");
var log = require("../src/commands/log.js");
var login = require("../src/commands/login.js");
var deploy = require("../src/commands/deploy.js");
var cancelDeploy = require("../src/commands/cancel-deploy.js");
var domain = require("../src/commands/domain.js");
var stop = require("../src/commands/stop.js");
var status = require("../src/commands/status.js");

function run(api) {
  // ARGUMENTS
  var appNameArgument = cliparse.argument("app-name", { description: "Application name" });
  var appIdArgument = cliparse.argument("app-id", { description: "Application ID" });
  var aliasArgument = cliparse.argument("app-alias", { description: "Application alias" });
  var envVariableName = cliparse.argument("variable-name", { description: "Name of the environment variable" });
  var envVariableValue = cliparse.argument("variable-value", { description: "Value of the environment variable" });
  var fqdnArgument = cliparse.argument("fqdn", { description: "Domain name of the Clever-Cloud application" });

  // OPTIONS
  var orgaOption = cliparse.option("orga", { aliases: ["o"], description: "Organisation ID" });
  var aliasOption = cliparse.option("alias", { aliases: ["a"], description: "Short name for the application" });
  var instanceTypeOption = cliparse.option("type", { aliases: ["t"], required: true, description: "Instance type" });
  var regionOption = cliparse.option("region", { aliases: ["r"], default: "par", description: "Region, can be 'par' for Paris or 'mtl' for Montreal" });
  var branchOption = cliparse.option("branch", { aliases: ["b"], default: "master", description: "Branch to push (master by default)" });
  var verboseOption = cliparse.flag("verbose", { aliases: ["v"], description: "Verbose output" });

  // CREATE COMMAND
  var appCreateCommand = cliparse.command("create", {
    description: "Create a Clever-Cloud application",
    args: [appNameArgument],
    options: [
      orgaOption,
      aliasOption,
      instanceTypeOption,
      regionOption
    ]
  }, _.partial(create, api));

  // LINK COMMAND
  var appLinkCommand = cliparse.command("link", {
    description: "Link this repo to an existing Clever-Cloud application",
    args: [appIdArgument],
    options: [
      orgaOption,
      aliasOption
    ]
  }, _.partial(link, api));

  // UNLINK COMMAND
  var appUnlinkCommand = cliparse.command("unlink", {
    description: "Unlink this repo from an existing Clever-Cloud application",
    args: [aliasArgument]
  }, _.partial(unlink, api));

  // ENV COMMANDS
  var envSetCommand = cliparse.command("set", {
    description: "Add or update an environment variable named <variable-name> with the value <variable-value>",
    args: [
      envVariableName,
      envVariableValue
    ]
  }, _.partial(env.set, api));

  var envRemoveCommand = cliparse.command("rm", {
    description: "Remove an environment variable from a Clever-Cloud application",
    args: [
      envVariableName
    ]
  }, _.partial(env.rm, api));

  var envCommands = cliparse.command("env", {
    description: "Manage Clever-Cloud application environment",
    options: [
      aliasOption
    ],
    commands: [
      envSetCommand,
      envRemoveCommand
    ]
  }, _.partial(env.list, api));

  // LOG COMMAND
  var logCommand = cliparse.command("log", {
    description: "Fetch some application logs, continuously",
    options: [
      aliasOption
    ]
  }, _.partial(log, api));

  // LOGIN COMMAND
  var loginCommand = cliparse.command("login", {
    description: "Login to Clever-Cloud"
  }, _.partial(login, api));

  // CANCEL DEPLOY COMMAND
  var cancelDeployCommand = cliparse.command("cancel-deploy", {
    description: "Cancel an ongoing deployment on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, _.partial(cancelDeploy, api));

  // DEPLOY COMMAND
  var deployCommand = cliparse.command("deploy", {
    description: "Deploy an application to Clever-Cloud",
    options: [
      aliasOption,
      branchOption
    ]
  }, _.partial(deploy, api));

  // DOMAIN COMMANDS
  var domainCreateCommand = cliparse.command("add", {
    description: "Add a domain name to a Clever-Cloud application",
    args: [
      fqdnArgument
    ]
  }, _.partial(domain.add, api));

  var domainRemoveCommand = cliparse.command("rm", {
    description: "Remove a domain name from a Clever-Cloud application",
    args: [
      fqdnArgument
    ]
  }, _.partial(domain.rm, api));

  var domainCommands = cliparse.command("domain", {
    description: "Manage Clever-Cloud application domain names",
    options: [
      aliasOption
    ],
    commands: [
      domainCreateCommand,
      domainRemoveCommand
    ]
  }, _.partial(domain.list, api));

  // STOP COMMAND
  var stopCommand = cliparse.command("stop", {
    description: "Stop a running application on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, _.partial(stop, api));

  // STATUS COMMAND
  var statusCommand = cliparse.command("status", {
    description: "See the status of an application on Clever-Cloud",
    options: [
      aliasOption
    ]
  }, _.partial(status, api));

  // CLI PARSER
  var cliParser = cliparse.cli({
    name: "clever",
    description: "CLI tool to manage Clever-Cloud data and products",
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
      statusCommand
    ]
  });

  cliparse.parse(cliParser);
}

var s_api = require("../src/models/api.js")();
s_api.onValue(run);
s_api.onError(Logger.error.bind(console));
