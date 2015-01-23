#! /usr/bin/env node

var _ = require("lodash");
var cliparse = require("cliparse");

var Logger = require("../src/logger.js");

var app = require("../src/app.js");
var env = require("../src/env.js");
var log = require("../src/log.js");
var login = require("../src/login.js");
var deploy = require("../src/deploy.js");
var domain = require("../src/domain.js");

function run(api) {
  // ARGUMENTS
  var appNameArgument = cliparse.argument("app-name", { helpT: "Application name" });
  var appIdArgument = cliparse.argument("app-id", { helpT: "Application ID" });
  var aliasArgument = cliparse.argument("app-alias", { helpT: "Application alias" });
  var envVariableName = cliparse.argument("variable-name", { helpT: "Name of the environment variable" });
  var envVariableValue = cliparse.argument("variable-value", { helpT: "Value of the environment variable" });
  var fqdnArgument = cliparse.argument("fqdn", { helpT: "Domain name of the Clever-Cloud application" });

  // OPTIONS
  var orgaOption = cliparse.option("orga", { aliases: ["o"], helpT: "Organisation ID" });
  var aliasOption = cliparse.option("alias", { helpT: "Short name for the application" });
  var instanceTypeOption = cliparse.option("type", { aliases: ["t"], required: true, helpT: "Instance type" });
  var regionOption = cliparse.option("region", { aliases: ["r"], defaultValue: "par", helpT: "Region, can be 'par' for Paris or 'mtl' for Montreal" });
  var branchOption = cliparse.option("branch", { aliases: ["b"], defaultValue: "master", helpT: "Branch to push (master by default)" });

  // APPLICATION COMMANDS
  var appCreateCommand = cliparse.command("create", {
    description: "Create a Clever-Cloud application",
    args: [appNameArgument],
    options: [
      orgaOption,
      aliasOption,
      instanceTypeOption,
      regionOption
    ]
  }, _.partial(app.create, api));

  var appLinkCommand = cliparse.command("link", {
    description: "Link this repo to an existing Clever-Cloud application",
    args: [appIdArgument],
    options: [
      orgaOption,
      aliasOption
    ]
  }, _.partial(app.link, api));

  var appCommands = cliparse.command("app", {
    description: "Manage Clever-Cloud applications",
    commands: [
      appCreateCommand,
      appLinkCommand
    ]
  });

  // ENV COMMANDS
  var envListCommand = cliparse.command("list", {
    description: "List the environment variables that are set for a Clever-Cloud application",
    options: [
      aliasOption
    ]
  }, _.partial(env.list, api));

  var envSetCommand = cliparse.command("set", {
    description: "Add or update an environment variable named <variable-name> with the value <variable-value>",
    args: [
      envVariableName,
      envVariableValue
    ],
    options: [
      aliasOption
    ]
  }, _.partial(env.set, api));

  var envRemoveCommand = cliparse.command("remove", {
    description: "Remove an environment variable from a Clever-Cloud application",
    args: [
      envVariableName
    ],
    options: [
      aliasOption
    ]
  }, _.partial(env.remove, api));

  var envCommands = cliparse.command("env", {
    description: "Manage Clever-Cloud application environment",
    commands: [
      envListCommand,
      envSetCommand,
      envRemoveCommand
    ]
  });

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

  // DEPLOY COMMAND
  var deployCommand = cliparse.command("deploy", {
    description: "Deploy an application to Clever-Cloud",
    options: [
      aliasOption,
      branchOption
    ]
  }, _.partial(deploy, api));

  // DOMAIN COMMANDS
  var domainListCommand = cliparse.command("list", {
    description: "List the domain names that are set for a Clever-Cloud application",
    options: [
      aliasOption
    ]
  }, _.partial(domain.list, api));

  var domainCreateCommand = cliparse.command("create", {
    description: "Add a domain name to a Clever-Cloud application",
    args: [
      fqdnArgument
    ],
    options: [
      aliasOption
    ]
  }, _.partial(domain.create, api));

  var domainRemoveCommand = cliparse.command("remove", {
    description: "Remove a domain name from a Clever-Cloud application",
    args: [
      fqdnArgument
    ],
    options: [
      aliasOption
    ]
  }, _.partial(domain.remove, api));

  var domainCommands = cliparse.command("domain", {
    description: "Manage Clever-Cloud application domain names",
    commands: [
      domainListCommand,
      domainCreateCommand,
      domainRemoveCommand
    ]
  });

  // CLI PARSER
  var cliParser = cliparse.cli({
    name: "clever",
    description: "CLI tool to manage Clever-Cloud data and products",
    commands: [
      appCommands,
      envCommands,
      logCommand,
      loginCommand,
      deployCommand,
      domainCommands
    ]
  });

  cliparse.parseValues(cliParser);
}

var s_api = require("../src/models/api.js")();
s_api.onValue(run);
s_api.onError(Logger.error.bind(console));
