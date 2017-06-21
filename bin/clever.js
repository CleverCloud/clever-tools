#! /usr/bin/env node

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', function(error) {
  if(error.code == 'EPIPE') {
    process.exit(0);
  }
});

require('update-notifier')({ pkg: require('../package.json') }).notify();

if(process.argv.indexOf("-v") >= 0 || process.argv.indexOf("--verbose") >= 0) {
  process.env["CLEVER_VERBOSE"] = "1";
}

if(process.argv.indexOf('--autocomplete-index') >= 0) {
  // Don't log anything in autocomplete mode
  process.env["CLEVER_QUIET"] = "1";
}

var _ = require("lodash");
var cliparse = require("cliparse");

var Logger = require("../src/logger.js");
var pkg = require("../package.json");

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
var adelete = lazyRequiref("../src/commands/delete.js");
var link = lazyRequiref("../src/commands/link.js");
var unlink = lazyRequiref("../src/commands/unlink.js");
var env = lazyRequire("../src/commands/env.js");
var publishedConfig = lazyRequire("../src/commands/published-config.js");
var logs = lazyRequiref("../src/commands/logs.js");
var login = lazyRequiref("../src/commands/login.js");
var deploy = lazyRequire("../src/commands/deploy.js");
var cancelDeploy = lazyRequiref("../src/commands/cancel-deploy.js");
var domain = lazyRequire("../src/commands/domain.js");
var stop = lazyRequiref("../src/commands/stop.js");
var status = lazyRequiref("../src/commands/status.js");
var activity = lazyRequiref("../src/commands/activity.js");
var addon = lazyRequire("../src/commands/addon.js");
var drain = lazyRequire("../src/commands/drain.js");
var service = lazyRequire("../src/commands/service.js");
var applications = lazyRequiref("../src/commands/applications.js");
var scale = lazyRequiref("../src/commands/scale.js");
var open = lazyRequiref("../src/commands/open.js");
var makeDefault = lazyRequiref("../src/commands/makeDefault.js");
var notifications = lazyRequire("../src/commands/notifications.js");
var ssh = lazyRequiref("../src/commands/ssh.js");

var Application = lr("../src/models/application.js");
var Notification = lr("../src/models/notification.js");
var Parsers = require("../src/parsers.js");

function run() {

  // ARGUMENTS
  var appNameCreationArgument = cliparse.argument("app-name", { description: "Application name" });
  var appIdOrNameArgument = cliparse.argument("app-id", { description: "Application ID (or name, if unambiguous)", parser: Parsers.appIdOrName });
  var aliasArgument = cliparse.argument("app-alias", { description: "Application alias" });
  var envVariableName = cliparse.argument("variable-name", { description: "Name of the environment variable" });
  var envVariableValue = cliparse.argument("variable-value", { description: "Value of the environment variable" });
  var fqdnArgument = cliparse.argument("fqdn", { description: "Domain name of the Clever Cloud application" });
  var addonIdOrNameArgument = cliparse.argument("addon-id", { description: "Addon ID (or name, if unambiguous)", parser: Parsers.addonIdOrName });
  var addonNameArgument = cliparse.argument("addon-name", { description: "Addon name" });
  var addonProviderArgument = cliparse.argument("addon-provider", { description: "Addon provider" });
  var drainUrlArgument = cliparse.argument("drain-url", { description: "Drain URL" });
  var drainTypeArgument = cliparse.argument("drain-type", { description: "Drain type" });
  var notificationNameArgument = cliparse.argument("name", { description: "Notification name" });
  var webhookUrlArgument = cliparse.argument("url", { description: "Webhook URL" });
  var notificationIdArgument = cliparse.argument("notification-id", { description: "Notification ID" });

  // OPTIONS
  var orgaIdOrNameOption = cliparse.option("org", { aliases: ["o"], description: "Organisation ID (or name, if unambiguous)", parser: Parsers.orgaIdOrName });
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
  var githubOption = cliparse.option("github", {
      aliases: [],
      metavar: "OWNER/REPO",
      description: "Github application to use for deployments"
  });
  var confirmApplicationDeletionOption = cliparse.flag("yes", { aliases: ["y"], description: "Skip confirmation and delete the application directly" });
  var branchOption = cliparse.option("branch", {
      aliases: ["b"],
      default: "",
      metavar: "branch",
      description: "Branch to push (current branch by default)",
      complete: function() {
        var path = require("path");
        var Git = require("../src/models/git.js")(path.resolve("."));
        return Git.completeBranches() } });
  var commitOption = cliparse.option("commit", {
      metavar: "commit id",
      description: "Restart the application with a specific commit id"
  });
  var verboseOption = cliparse.flag("verbose", { aliases: ["v"], description: "Verbose output" });
  var noUpdateNotifierOption = cliparse.flag("no-update-notifier", { description: "Don't notify available updates for clever-tools" });
  var showAllActivityOption = cliparse.flag("show-all", { description: "Show all activity" });
  var showAllOption = cliparse.flag("show-all", { description: "Show all available dependencies" });
  var onlyAppsOption = cliparse.flag("only-apps", { description: "Only show app dependencies" });
  var onlyAddonsOption = cliparse.flag("only-addons", { description: "Only show addon dependencies" });
  var showAllOption = cliparse.flag("show-all", { description: "Show all available dependencies" });
  var showAllAddonsOption = cliparse.flag("show-all", { description: "Show all available addons" });
  var followOption = cliparse.flag("follow", { aliases: ["f"], description: "Track new deployments in activity list" });
  var quietOption = cliparse.flag("quiet", { aliases: ["q"], description: "Don't show logs during deployment" });
  var forceDeployOption = cliparse.flag("force", { aliases: ["f"], description: "Force deploy even if it's not fast-forwardable" });
  var withoutCacheOption = cliparse.flag("without-cache", { description: "Restart the application without using cache" });
  var addonRegionOption = cliparse.option("region", {
      alias: ["r"],
      default: "eu",
      metavar: "region",
      description: "Region to provision the addon in, depends on the provider",
      complete: addon("completeRegion")
  });
  var addonPlanOption = cliparse.option("plan", {
      alias: ["p"],
      default: "dev",
      metavar: "plan",
      description: "Addon plan, depends on the provider",
      complete: addon("completePlan")
  });
  var linkAddonOption = cliparse.option("link", {
      aliases: ["l"],
      metavar: "alias",
      description: "Link the created addon to the app with the specified alias",
      complete: Application("listAvailableAliases")
  });
  var confirmAddonCreationOption = cliparse.flag("yes", { aliases: ["y"], description: "Skip confirmation even if the addon is not free" });
  var confirmAddonDeletionOption = cliparse.flag("yes", { aliases: ["y"], description: "Skip confirmation and delete the addon directly" });
  var drainCredentialsOption = cliparse.option("credentials", {
    alias: ["c"],
    metavar: "credentials",
    description: "HTTP Authorization header to connect drain to your endpoint",
    complete: Application("listDrains")
  });
  var sourceableEnvVarsList = cliparse.flag("add-export", { aliases: [], description: "Display sourceable env variables setting" });
  var onlyAliasesOption = cliparse.flag("only-aliases", { aliases: [], description: "List only application aliases" });
  var minFlavorOption = cliparse.option("min-flavor", {
    metavar: "minflavor",
    parser: Parsers.flavor,
    description: "The minimum scale for your application",
    complete: function() {return cliparse.autocomplete.words(Application("listAvailableFlavors")())}
  });
  var maxFlavorOption = cliparse.option("max-flavor", {
    metavar: "maxflavor",
    parser: Parsers.flavor,
    description: "The maximum scale for your application",
    complete: function() {return cliparse.autocomplete.words(Application("listAvailableFlavors")())}
  });
  var flavorOption = cliparse.option("flavor", {
    metavar: "flavor",
    parser: Parsers.flavor,
    description: "The scale of your application",
    complete: function() {return cliparse.autocomplete.words(Application("listAvailableFlavors")())}
  });
  var minInstancesOption = cliparse.option("min-instances", {
    metavar: "mininstances",
    parser: Parsers.instances,
    description: "The minimum number of parallels instances"
  });
  var maxInstancesOption = cliparse.option("max-instances", {
    metavar: "maxinstances",
    parser: Parsers.instances,
    description: "The maximum number of parallels instances"
  });
  var instancesOption = cliparse.option("instances", {
    metavar: "instances",
    parser: Parsers.instances,
    description: "The number of parallels instances"
  });
  var beforeOption = cliparse.option("before", {
    metavar: "before",
    parser: Parsers.date,
    description: "Fetch logs before this date (ISO8601)"
  });
  var afterOption = cliparse.option("after", {
    metavar: "after",
    parser: Parsers.date,
    description: "Fetch logs after this date (ISO8601)"
  });
  var searchOption = cliparse.option("search", {
    metavar: "search",
    description: "Fetch logs matching this pattern"
  });
  var deploymentIdOption = cliparse.option("deployment-id", {
    metavar: "deployment_id",
    description: "Fetch logs for a given deployment"
  });
  var listAllNotificationsOption = cliparse.flag("list-all", {
    description: "List all notifications for your user or for an organisation with the `--org` option"
  });
  var webhookFormatOption = cliparse.option("format", {
    metavar: "format",
    default: "raw",
    description: "Format of the body sent to the webhook ('raw', 'slack', or 'flowdock')"
  });
  var emailNotificationTargetOption = cliparse.option("notify", {
    metavar: "<email_address>|<user_id>|organisation",
    description: "Notify a user, a specific email address or the whole organisation (multiple values allowed)"
  });
  var notificationEventTypeOption = cliparse.option("event", {
    metavar: "type",
    description: "Restrict notifications to specific event types",
    complete: Notification("listMetaEvents")
  });
  var notificationScopeOption = cliparse.option("service", {
    metavar: "service_id",
    description: "Restrict notifications to specific applications and addons"
  });
  var loginTokenOption = cliparse.option("token", {
    metavar: "token",
    description: "Directly give an existing token"
  });
  var loginSecretOption = cliparse.option("secret", {
    metavar: "secret",
    description: "Directly give an existing secret"
  });

  // CREATE COMMAND
  var appCreateCommand = cliparse.command("create", {
    description: "Create a Clever Cloud application",
    args: [appNameCreationArgument],
    options: [
      instanceTypeOption,
      orgaIdOrNameOption,
      aliasCreationOption,
      regionOption,
      githubOption
    ]
  }, create);

  // DELETE COMMAND
  var appDeleteCommand = cliparse.command("delete", {
    description: "Delete a Clever Cloud application",
    args: [],
    options: [
      aliasOption,
      confirmApplicationDeletionOption
    ]
  }, adelete);

  // LINK COMMAND
  var appLinkCommand = cliparse.command("link", {
    description: "Link this repo to an existing Clever Cloud application",
    args: [appIdOrNameArgument],
    options: [
      aliasCreationOption,
      orgaIdOrNameOption
    ]
  }, link);

  // UNLINK COMMAND
  var appUnlinkCommand = cliparse.command("unlink", {
    description: "Unlink this repo from an existing Clever Cloud application",
    args: [aliasArgument]
  }, unlink);

  // MAKE DEFAULT COMMAND
  var makeDefaultCommand = cliparse.command("make-default", {
      description: "Make a linked application the default one",
      args: [aliasArgument]
  }, makeDefault);

  // ENV COMMANDS
  var envSetCommand = cliparse.command("set", {
    description: "Add or update an environment variable named <variable-name> with the value <variable-value>",
    args: [
      envVariableName,
      envVariableValue
    ]
  }, env("set"));

  var envRemoveCommand = cliparse.command("rm", {
    description: "Remove an environment variable from a Clever Cloud application",
    args: [
      envVariableName
    ]
  }, env("rm"));

  var envImportCommand = cliparse.command("import", {
    description: "Load environment variables from STDIN",
    args: [
    ]
  }, env("importEnv"));

  var envCommands = cliparse.command("env", {
    description: "Manage Clever Cloud application environment",
    options: [
      aliasOption,
      sourceableEnvVarsList
    ],
    commands: [
      envSetCommand,
      envRemoveCommand,
      envImportCommand
    ]
  }, env("list"));

  // PUBLISHED CONFIG COMMANDS
  var publishedConfigSetCommand = cliparse.command("set", {
    description: "Add or update a published configuration item named <variable-name> with the value <variable-value>",
    args: [
      envVariableName,
      envVariableValue
    ]
  }, publishedConfig("set"));

  var publishedConfigRemoveCommand = cliparse.command("rm", {
    description: "Remove a published configuration item from a Clever Cloud application",
    args: [
      envVariableName
    ]
  }, publishedConfig("rm"));

  var publishedConfigImportCommand = cliparse.command("import", {
    description: "Load published configuration from STDIN",
    args: [
    ]
  }, publishedConfig("importEnv"));

  var publishedConfigCommands = cliparse.command("published-config", {
    description: "Manage the configuration made available to other applications by this application",
    options: [
      aliasOption
    ],
    commands: [
      publishedConfigSetCommand,
      publishedConfigRemoveCommand,
      publishedConfigImportCommand
    ]
  }, publishedConfig("list"));

  // LOGS COMMAND
  var logsCommand = cliparse.command("logs", {
    description: "Fetch application logs, continuously",
    options: [
      aliasOption,
      beforeOption,
      afterOption,
      searchOption,
      deploymentIdOption
    ]
  }, logs);

  // LOGIN COMMAND
  var loginCommand = cliparse.command("login", {
    description: "Login to Clever Cloud",
    options: [
      loginTokenOption,
      loginSecretOption
    ]
  }, login);

  // CANCEL DEPLOY COMMAND
  var cancelDeployCommand = cliparse.command("cancel-deploy", {
    description: "Cancel an ongoing deployment on Clever Cloud",
    options: [
      aliasOption
    ]
  }, cancelDeploy);

  // DEPLOY COMMAND
  var deployCommand = cliparse.command("deploy", {
    description: "Deploy an application to Clever Cloud",
    options: [
      aliasOption,
      branchOption,
      quietOption,
      forceDeployOption
    ]
  }, deploy("deploy"));

  // RESTART COMMAND
  var restartCommand = cliparse.command("restart", {
    description: "Start or restart a Clever Cloud application",
    options: [
      aliasOption,
      commitOption,
      withoutCacheOption,
      quietOption
    ]
  }, deploy("restart"));

  // DOMAIN COMMANDS
  var domainCreateCommand = cliparse.command("add", {
    description: "Add a domain name to a Clever Cloud application",
    args: [
      fqdnArgument
    ]
  }, domain("add"));

  var domainRemoveCommand = cliparse.command("rm", {
    description: "Remove a domain name from a Clever Cloud application",
    args: [
      fqdnArgument
    ]
  }, domain("rm"));

  var domainCommands = cliparse.command("domain", {
    description: "Manage Clever Cloud application domain names",
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
    description: "Stop a running application on Clever Cloud",
    options: [
      aliasOption
    ]
  }, stop);

  // STATUS COMMAND
  var statusCommand = cliparse.command("status", {
    description: "See the status of an application on Clever Cloud",
    options: [
      aliasOption
    ]
  }, status);

  // ACTIVITY COMMAND
  var activityCommand = cliparse.command("activity", {
    description: "Show last deployments of a Clever Cloud application",
    options: [
      aliasOption,
      followOption,
      showAllActivityOption
    ]
  }, activity);

  // SERVICE COMMANDS
  var serviceLinkAppCommand = cliparse.command("link-app", {
    description: "Add an existing app as a dependency",
    args: [
      appIdOrNameArgument,
    ]
  }, service("linkApp"));

  var serviceUnlinkAppCommand = cliparse.command("unlink-app", {
    description: "Remove an app from the dependencies",
    args: [
      appIdOrNameArgument
    ]
  }, service("unlinkApp"));

  var serviceLinkAddonCommand = cliparse.command("link-addon", {
    description: "Link an existing addon to this application",
    args: [
      addonIdOrNameArgument,
    ]
  }, service("linkAddon"));

  var serviceUnlinkAddonCommand = cliparse.command("unlink-addon", {
    description: "Unlink an addon from this application",
    args: [
      addonIdOrNameArgument
    ]
  }, service("unlinkAddon"));

  var serviceCommands = cliparse.command("service", {
    description: "Manage service dependencies",
    options: [
      aliasOption,
      onlyAppsOption,
      onlyAddonsOption,
      showAllOption
    ],
    commands: [
      serviceLinkAppCommand,
      serviceUnlinkAppCommand,
      serviceLinkAddonCommand,
      serviceUnlinkAddonCommand
    ]
  }, service("list"));

  // ADDON COMMANDS
  var addonCreateCommand = cliparse.command("create", {
    description: "Create an addon",
    args: [ addonProviderArgument, addonNameArgument ],
    options: [
      linkAddonOption,
      confirmAddonCreationOption,
      addonPlanOption,
      addonRegionOption
    ]
  }, addon("create"));

  var addonRenameCommand = cliparse.command("rename", {
    description: "Rename an addon",
    args: [
      addonIdOrNameArgument,
      addonNameArgument
    ]
  }, addon("rename"));

  var addonDeleteCommand = cliparse.command("delete", {
    description: "Delete an addon",
    options: [
      confirmAddonDeletionOption,
    ],
    args: [
      addonIdOrNameArgument
    ]
  }, addon("delete"));

  var addonShowProviderCommand = cliparse.command("show", {
    description: "Show information about an addon provider",
    args: [addonProviderArgument]
  }, addon("showProvider"));

  var addonProvidersCommand = cliparse.command("providers", {
    description: "List available addon providers",
    args: [],
    commands: [
      addonShowProviderCommand
    ]
  }, addon("listProviders"));

  var addonCommands = cliparse.command("addon", {
    description: "Manage addons",
    options: [ orgaIdOrNameOption ],
    commands: [
      addonCreateCommand,
      addonDeleteCommand,
      addonRenameCommand,
      addonProvidersCommand
    ]
  }, addon("list"));

  //DRAIN COMMANDS
  var drainCreateCommand = cliparse.command("create", {
    description: "Create a drain",
    args: [ drainTypeArgument, drainUrlArgument ],
    options: [
      drainCredentialsOption
    ]
  }, addon("create"));
  var drainCommands = cliparse.command("drain", {
    description: "Manage drains",
    option: [orgaIdOrNameOption],
    commands: [
      drainCreateCommand
    ]
  }, drain("list"));

  //APPLICATIONS COMMAND
  var applicationsCommand = cliparse.command("applications", {
    description: "List linked applications",
    options: [ onlyAliasesOption ],
  }, applications);

  //SCALE COMMAND
  var scaleCommand = cliparse.command("scale", {
    description: "Change scalability of an application",
    options: [
      aliasOption,
      flavorOption,
      minFlavorOption,
      maxFlavorOption,
      instancesOption,
      minInstancesOption,
      maxInstancesOption
    ]
  }, scale);

  //OPEN COMMAND
  var openCommand = cliparse.command("open", {
    description: "Open an application in the browser",
    options: [ aliasOption ]
  }, open);

  //WEBHOOKS COMMAND
  var addWebhookCommand = cliparse.command("add", {
    description: "Register webhook to be called when events happen",
    options: [ webhookFormatOption, notificationEventTypeOption, notificationScopeOption],
    args: [ notificationNameArgument, webhookUrlArgument ]
  }, notifications("addWebhook"));

  var removeWebhookCommand = cliparse.command("remove", {
    description: "Remove an existing webhook",
    args: [ notificationIdArgument ]
  }, notifications("removeWebhook"));

  var webhooksCommand = cliparse.command("webhooks", {
    description: "Manage webhooks",
    options: [ orgaIdOrNameOption, listAllNotificationsOption ],
    commands: [
      addWebhookCommand,
      removeWebhookCommand
    ]
  }, notifications("listWebhooks"));

  //NOTIFY-EMAIL COMMAND
  var addEmailNotificationCommand = cliparse.command("add", {
    description: "Add a new email notification",
    options: [ notificationEventTypeOption, notificationScopeOption, emailNotificationTargetOption],
    args: [ notificationNameArgument ]
  }, notifications("addEmailNotification"));

  var removeEmailNotificationCommand = cliparse.command("remove", {
    description: "Remove an existing email notification",
    args: [ notificationIdArgument ]
  }, notifications("removeEmailNotification"));

  var emailNotificationsCommand = cliparse.command("notify-email", {
    description: "Manage email notifications",
    options: [ orgaIdOrNameOption, listAllNotificationsOption ],
    commands: [
      addEmailNotificationCommand,
      removeEmailNotificationCommand
    ]
  }, notifications("listEmailNotifications"));

  //SSH COMMAND
  var sshCommand = cliparse.command("ssh", {
    description: "Connect to running instances through SSH",
    options: [ aliasOption ],
    args: []
  }, ssh);

  // CLI PARSER
  var cliParser = cliparse.cli({
    name: "clever",
    description: "CLI tool to manage Clever Cloud data and products",
    version: pkg.version,
    options: [ verboseOption, noUpdateNotifierOption ],
    commands: [
      appCreateCommand,
      appDeleteCommand,
      appLinkCommand,
      appUnlinkCommand,
      makeDefaultCommand,
      envCommands,
      publishedConfigCommands,
      logsCommand,
      loginCommand,
      cancelDeployCommand,
      deployCommand,
      restartCommand,
      domainCommands,
      stopCommand,
      statusCommand,
      activityCommand,
      addonCommands,
      drainCommands,
      serviceCommands,
      applicationsCommand,
      scaleCommand,
      openCommand,
      webhooksCommand,
      emailNotificationsCommand,
      sshCommand
    ]
  });

  cliparse.parse(cliParser);
}
var s_api = require("../src/models/api.js")();

s_api.onError(Logger.error.bind(console));
run();
