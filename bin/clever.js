#! /usr/bin/env node

// WARNING: this needs to run before other imports
import '../src/initial-setup.js';

import cliparse from 'cliparse';
import colors from 'colors/safe.js';
import cliparseCommands from 'cliparse/src/command.js';
import _sortBy from 'lodash/sortBy.js';

import { getPackageJson } from '../src/load-package-json.cjs';
import * as git from '../src/models/git.js';
import * as Parsers from '../src/parsers.js';
import { handleCommandPromise } from '../src/command-promise-handler.js';
import * as Application from '../src/models/application.js';
import { AVAILABLE_ZONES } from '../src/models/application.js';
import { EXPERIMENTAL_FEATURES } from '../src/experimental-features.js';
import { getExitOnOption, getOutputFormatOption, getSameCommitPolicyOption } from '../src/command-options.js';
import { getFeatures, conf } from '../src/models/configuration.js';

import * as Addon from '../src/models/addon.js';
import * as ApplicationConfiguration from '../src/models/application_configuration.js';
import * as Drain from '../src/models/drain.js';
import * as Notification from '../src/models/notification.js';
import * as Namespaces from '../src/models/namespaces.js';

import * as accesslogsModule from '../src/commands/accesslogs.js';
import * as activity from '../src/commands/activity.js';
import * as addon from '../src/commands/addon.js';
import * as applications from '../src/commands/applications.js';
import * as cancelDeploy from '../src/commands/cancel-deploy.js';
import * as config from '../src/commands/config.js';
import * as create from '../src/commands/create.js';
import * as deleteCommandModule from '../src/commands/delete.js';
import * as deploy from '../src/commands/deploy.js';
import * as diag from '../src/commands/diag.js';
import * as domain from '../src/commands/domain.js';
import * as drain from '../src/commands/drain.js';
import * as env from '../src/commands/env.js';
import * as features from '../src/commands/features.js';
import * as kms from '../src/commands/kms.js';
import * as kv from '../src/commands/kv.js';
import * as link from '../src/commands/link.js';
import * as login from '../src/commands/login.js';
import * as logout from '../src/commands/logout.js';
import * as logs from '../src/commands/logs.js';
import * as makeDefault from '../src/commands/makeDefault.js';
import * as ng from '../src/commands/ng.js';
import * as notifyEmail from '../src/commands/notify-email.js';
import * as open from '../src/commands/open.js';
import * as consoleModule from '../src/commands/console.js';
import * as profile from '../src/commands/profile.js';
import * as publishedConfig from '../src/commands/published-config.js';
import * as restart from '../src/commands/restart.js';
import * as scale from '../src/commands/scale.js';
import * as service from '../src/commands/service.js';
import * as ssh from '../src/commands/ssh.js';
import * as status from '../src/commands/status.js';
import * as stop from '../src/commands/stop.js';
import * as tcpRedirs from '../src/commands/tcp-redirs.js';
import * as tokens from '../src/commands/tokens.js';
import * as unlink from '../src/commands/unlink.js';
import * as version from '../src/commands/version.js';
import * as webhooks from '../src/commands/webhooks.js';
import * as database from '../src/commands/database.js';
import { curl } from '../src/commands/curl.js';

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

// Patch cliparse.command so we can catch errors
const cliparseCommand = cliparse.command;

cliparse.command = function (name, options, commandFunction) {
  return cliparseCommand(name, options, (...args) => {
    const promise = commandFunction(...args);
    handleCommandPromise(promise);
  });
};

// Add a yellow color and status tag to the description of an experimental command
function colorizeExperimentalCommand (command, id) {
  const status = EXPERIMENTAL_FEATURES[id].status;
  command.description = colors.yellow(command.description + ' [' + status.toUpperCase() + ']');
  return command;
}

async function run () {

  // ARGUMENTS
  const args = {
    kmsKeyValue: cliparse.argument('key-value', { description: 'A key/value to store in a Clever KMS secret (e.g. secretKey=secretValue), can be used multiple times' }),
    kmsSecret: cliparse.argument('secret', { description: 'The secret to get from Clever KMS' }),
    kvRawCommand: cliparse.argument('command', { description: 'The raw command to send to the Materia KV or Redis® add-on' }),
    kvIdOrName: cliparse.argument('kv-id', {
      description: 'Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on',
    }),
    apiTokenId: cliparse.argument('api-token-id', { description: 'API token ID' }),
    apiTokenName: cliparse.argument('api-token-name', { description: 'API token name' }),
    ngId: cliparse.argument('id', {
      description: 'Network Group ID',
      parser: Parsers.ngResourceType,
    }),
    ngLabel: cliparse.argument('ng-label', {
      description: 'Network Group label',
      parser: Parsers.ngResourceType,
    }),
    ngIdOrLabel: cliparse.argument('ng-id-or-label', {
      description: 'Network Group ID or label',
      parser: Parsers.ngResourceType,
    }),
    ngDescription: cliparse.argument('ng-description', {
      description: 'Network Group description',
    }),
    ngExternalPeerLabel: cliparse.argument('external-peer-label', {
      description: 'External peer label',
      parser: Parsers.ngResourceType,
    }),
    ngExternalIdOrLabel: cliparse.argument('external-peer-id-or-label', {
      description: 'External peer ID or label',
      parser: Parsers.ngResourceType,
    }),
    ngAnyIdOrLabel: cliparse.argument('id-or-label', {
      description: 'ID or Label of a Network group, a member or an (external) peer',
      parser: Parsers.ngResourceType,
    }),
    wgPublicKey: cliparse.argument('public-key', {
      metavar: 'public_key',
      description: 'Wireguard public key of the external peer to link to a Network Group',
    }),
    addonIdOrName: cliparse.argument('addon-id', {
      description: 'Add-on ID (or name, if unambiguous)',
      parser: Parsers.addonIdOrName,
    }),
    addonName: cliparse.argument('addon-name', { description: 'Add-on name' }),
    addonProvider: cliparse.argument('addon-provider', { description: 'Add-on provider' }),
    alias: cliparse.argument('app-alias', { description: 'Application alias' }),
    appIdOrName: cliparse.argument('app-id', {
      description: 'Application ID (or name, if unambiguous)',
      parser: Parsers.appIdOrName,
    }),
    appNameCreation: cliparse.argument('app-name', {
      description: 'Application name (optional, current directory name is used if not specified)',
      default: '',
    }),
    backupId: cliparse.argument('backup-id', { description: 'A Database backup ID (format: UUID)' }),
    databaseId: cliparse.argument('database-id', { description: 'Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)' }),
    drainId: cliparse.argument('drain-id', { description: 'Drain ID' }),
    drainType: cliparse.argument('drain-type', {
      description: 'Drain type',
      complete: Drain.listDrainTypes,
    }),
    drainUrl: cliparse.argument('drain-url', { description: 'Drain URL' }),
    fqdn: cliparse.argument('fqdn', { description: 'Domain name of the application' }),
    features: cliparse.argument('features', {
      description: 'Comma-separated list of experimental features to manage',
      parser: Parsers.commaSeparated,
    }),
    featureId: cliparse.argument('feature', { description: 'Experimental feature to manage' }),
    notificationName: cliparse.argument('name', { description: 'Notification name' }),
    notificationId: cliparse.argument('notification-id', { description: 'Notification ID' }),
    webhookUrl: cliparse.argument('url', { description: 'Webhook URL' }),
    envVariableName: cliparse.argument('variable-name', { description: 'Name of the environment variable' }),
    envVariableNames: cliparse.argument('variable-names', {
      description: 'Comma separated list of names of the environment variables',
      parser: Parsers.commaSeparated,
    }),
    envVariableValue: cliparse.argument('variable-value', { description: 'Value of the environment variable' }),
    port: cliparse.argument('port', {
      description: 'port identifying the TCP redirection',
      parser: Parsers.integer,
    }),
    configurationName: cliparse.argument('configuration-name', {
      description: 'The name of the configuration to manage',
      complete () {
        return cliparse.autocomplete.words(ApplicationConfiguration.listAvailableIds());
      },
    }),
    configurationValue: cliparse.argument('configuration-value', { description: 'The new value of the configuration' }),
  };

  // OPTIONS
  const opts = {
    apiTokenExpiration: cliparse.option('expiration', {
      aliases: ['e'],
      metavar: 'expiration',
      parser: Parsers.futureDateOrDuration,
      description: 'Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y',
    }),
    // Network Groups options
    ngDescription: cliparse.option('description', {
      metavar: 'description',
      description: 'Network Group description',
    }),
    ngMembersIdsToLink: cliparse.option('link', {
      metavar: 'members_ids',
      description: "Comma separated list of members IDs to link to a Network Group ('app_xxx', 'addon_xxx', 'external_xxx')",
      parser: Parsers.commaSeparated,
    }),
    ngMemberLabel: cliparse.option('label', {
      required: false,
      metavar: 'member_label',
      description: 'The member label',
      parser: Parsers.ngResourceType,
    }),
    ngPeerGetConfig: cliparse.flag('config', {
      description: 'Get the Wireguard configuration of an external peer',
    }),
    ngResourceType: cliparse.option('type', {
      metavar: 'type',
      description: 'Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)',
      parser: Parsers.ngValidType,
    }),
    sourceableEnvVarsList: cliparse.flag('add-export', { description: 'Display sourceable env variables setting' }),
    logsFormat: getOutputFormatOption(['json-stream']),
    activityFormat: getOutputFormatOption(['json-stream']),
    envFormat: getOutputFormatOption(['shell']),
    importAsJson: cliparse.flag('json', {
      description: 'Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects)',
    }),
    addonId: cliparse.option('addon', { metavar: 'addon_id', description: 'Add-on ID' }),
    after: cliparse.option('after', {
      metavar: 'after',
      aliases: ['since'],
      parser: Parsers.date,
      description: 'Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
    }),
    aliasCreation: cliparse.option('alias', {
      aliases: ['a'],
      metavar: 'alias',
      description: 'Short name for the application',
    }),
    alias: cliparse.option('alias', {
      aliases: ['a'],
      metavar: 'alias',
      description: 'Short name for the application',
      complete: Application.listAvailableAliases,
    }),
    domain: cliparse.option('filter', {
      default: '',
      metavar: 'TEXT',
      description: 'Check only domains containing the provided text',
    }),
    domainOverviewFilter: cliparse.option('filter', {
      default: '',
      metavar: 'TEXT',
      description: 'Get only domains containing the provided text',
    }),
    naturalName: cliparse.flag('natural-name', {
      aliases: ['n'],
      description: 'Show the application names or aliases if possible',
    }),
    before: cliparse.option('before', {
      metavar: 'before',
      aliases: ['until'],
      parser: Parsers.date,
      description: 'Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
    }),
    branch: cliparse.option('branch', {
      aliases: ['b'],
      default: '',
      metavar: 'branch',
      description: 'Branch to push (current branch by default)',
      complete () {
        return git.completeBranches();
      },
    }),
    commit: cliparse.option('commit', {
      metavar: 'commit id',
      description: 'Restart the application with a specific commit ID',
    }),
    gitTag: cliparse.option('tag', {
      aliases: ['t'],
      default: '',
      metavar: 'tag',
      description: 'Tag to push (none by default)',
    }),
    databaseId: cliparse.option('database-id', {
      metavar: 'database_id',
      description: 'The Database ID (e.g.: postgresql_xxx)',
    }),
    deploymentId: cliparse.option('deployment-id', {
      metavar: 'deployment_id',
      description: 'Fetch logs for a given deployment',
    }),
    namespace: cliparse.option('namespace', {
      metavar: 'namespace',
      description: 'Namespace in which the TCP redirection should be',
      required: true,
      complete: Namespaces.completeNamespaces,
    }),
    notificationEventType: cliparse.option('event', {
      metavar: 'type',
      description: 'Restrict notifications to specific event types',
      complete: Notification.listMetaEvents,
      parser: Parsers.commaSeparated,
    }),
    flavor: cliparse.option('flavor', {
      metavar: 'flavor',
      parser: Parsers.flavor,
      description: 'The instance size of your application',
      complete () {
        return cliparse.autocomplete.words(Application.listAvailableFlavors());
      },
    }),
    follow: cliparse.flag('follow', {
      aliases: ['f'],
      description: 'Track new deployments in activity list',
    }),
    forceDeploy: cliparse.flag('force', {
      aliases: ['f'],
      description: 'Force deploy even if it\'s not fast-forwardable',
    }),
    exitOnDeploy: getExitOnOption(),
    sameCommitPolicy: getSameCommitPolicyOption(),
    webhookFormat: cliparse.option('format', {
      metavar: 'format',
      default: 'raw',
      description: 'Format of the body sent to the webhook (\'raw\', \'slack\', \'gitter\', or \'flowdock\')',
    }),
    github: cliparse.option('github', {
      metavar: 'OWNER/REPO',
      description: 'GitHub application to use for deployments',
    }),
    sshIdentityFile: cliparse.option('identity-file', {
      aliases: ['i'],
      metavar: 'identity-file',
      description: 'SSH identity file',
    }),
    instances: cliparse.option('instances', {
      metavar: 'instances',
      parser: Parsers.instances,
      description: 'The number of parallel instances',
    }),
    linkAddon: cliparse.option('link', {
      aliases: ['l'],
      metavar: 'alias',
      description: 'Link the created add-on to the app with the specified alias',
      complete: Application.listAvailableAliases,
    }),
    listAllNotifications: cliparse.flag('list-all', { description: 'List all notifications for your user or for an organisation with the \'--org\' option' }),
    maxFlavor: cliparse.option('max-flavor', {
      metavar: 'maxflavor',
      parser: Parsers.flavor,
      description: 'The maximum instance size of your application',
      complete () {
        return cliparse.autocomplete.words(Application.listAvailableFlavors());
      },
    }),
    buildFlavor: cliparse.option('build-flavor', {
      metavar: 'buildflavor',
      parser: Parsers.buildFlavor,
      description: 'The size of the build instance, or \'disabled\' if you want to disable dedicated build instances',
    }),
    maxInstances: cliparse.option('max-instances', {
      metavar: 'maxinstances',
      parser: Parsers.instances,
      description: 'The maximum number of parallel instances',
    }),
    minFlavor: cliparse.option('min-flavor', {
      metavar: 'minflavor',
      parser: Parsers.flavor,
      description: 'The minimum scale size of your application',
      complete () {
        return cliparse.autocomplete.words(Application.listAvailableFlavors());
      },
    }),
    minInstances: cliparse.option('min-instances', {
      metavar: 'mininstances',
      parser: Parsers.instances,
      description: 'The minimum number of parallel instances',
    }),
    updateNotifier: cliparse.flag('update-notifier', {
      description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
      default: true,
    }),
    emailNotificationTarget: cliparse.option('notify', {
      metavar: '<email_address>|<user_id>|"organisation"',
      description: 'Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)',
      required: true,
      parser: Parsers.commaSeparated,
    }),
    onlyAddons: cliparse.flag('only-addons', { description: 'Only show add-on dependencies' }),
    onlyAliases: cliparse.flag('only-aliases', { description: 'List only application aliases' }),
    onlyApps: cliparse.flag('only-apps', { description: 'Only show app dependencies' }),
    appIdOrName: cliparse.option('app', {
      metavar: 'ID_OR_NAME',
      description: 'Application to manage by its ID (or name, if unambiguous)',
      parser: Parsers.appIdOrName,
    }),
    orgaIdOrName: cliparse.option('org', {
      metavar: 'ID_OR_NAME',
      aliases: ['o', 'owner'],
      description: 'Organisation to target by its ID (or name, if unambiguous)',
      parser: Parsers.orgaIdOrName,
    }),
    output: cliparse.option('output', {
      aliases: ['out'],
      description: 'Redirect the output of the command in a file',
    }),
    drainPassword: cliparse.option('password', {
      aliases: ['p'],
      metavar: 'password',
      description: '(HTTP drains) basic auth password',
    }),
    addonPlan: cliparse.option('plan', {
      aliases: ['p'],
      default: '',
      metavar: 'plan',
      description: 'Add-on plan, depends on the provider',
      complete: Addon.completePlan,
    }),
    quiet: cliparse.flag('quiet', { aliases: ['q'], description: 'Don\'t show logs during deployment' }),
    followDeployLogs: cliparse.flag('follow', {
      description: 'Continue to follow logs after deployment has ended',
    }),
    addonRegion: cliparse.option('region', {
      aliases: ['r'],
      default: 'par',
      metavar: 'region',
      description: 'Region to provision the add-on in, depends on the provider',
      complete: Addon.completeRegion,
    }),
    addonVersion: cliparse.option('addon-version', {
      metavar: 'addon-version',
      description: 'The version to use for the add-on',
    }),
    addonOptions: cliparse.option('option', {
      metavar: 'option',
      parser: Parsers.addonOptions,
      description: 'Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options',
    }),
    region: cliparse.option('region', {
      aliases: ['r'],
      default: 'par',
      metavar: 'zone',
      description: `Region, can be ${AVAILABLE_ZONES.map((name) => `'${name}'`).join(', ')}`,
      complete: Application.listAvailableZones,
    }),
    search: cliparse.option('search', {
      metavar: 'search',
      description: 'Fetch logs matching this pattern',
    }),
    loginSecret: cliparse.option('secret', {
      metavar: 'secret',
      description: 'Directly give an existing secret',
    }),
    notificationScope: cliparse.option('service', {
      metavar: 'service_id',
      description: 'Restrict notifications to specific applications and add-ons',
      parser: Parsers.commaSeparated,
    }),
    showAllActivity: cliparse.flag('show-all', { description: 'Show all activity' }),
    showAll: cliparse.flag('show-all', { description: 'Show all available add-ons and applications' }),
    loginToken: cliparse.option('token', {
      metavar: 'token',
      description: 'Directly give an existing token',
    }),
    taskCommand: cliparse.option('task', {
      description: 'The application launch as a task executing the given command, then stopped',
      aliases: ['T'],
      parser: Parsers.nonEmptyString,
      metavar: 'command',
    }),
    instanceType: cliparse.option('type', {
      aliases: ['t'],
      required: true,
      metavar: 'type',
      description: 'Instance type',
      complete: Application.listAvailableTypes,
    }),
    drainUsername: cliparse.option('username', {
      aliases: ['u'],
      metavar: 'username',
      description: '(HTTP drains) basic auth username',
    }),
    drainAPIKey: cliparse.option('api-key', {
      aliases: ['k'],
      metavar: 'api_key',
      description: '(NewRelic drains) API key',
    }),
    drainIndexPrefix: cliparse.option('index-prefix', {
      aliases: ['i'],
      metavar: 'index_prefix',
      description: '(ElasticSearch drains) optional index prefix. `logstash` value is used if not set',
    }),
    drainSDParameters: cliparse.option('sd-params', {
      aliases: ['s'],
      metavar: 'sd_params',
      description: '(TCP and UDP drains) sd-params string (e.g.: `X-OVH-TOKEN=\\"REDACTED\\"`)',
    }),
    verbose: cliparse.flag('verbose', { aliases: ['v'], description: 'Verbose output' }),
    color: cliparse.flag('color', {
      description: 'Choose whether to print colors or not. You can also use --no-color',
      default: true,
    }),
    withoutCache: cliparse.flag('without-cache', { description: 'Restart the application without using cache' }),
    confirmAddonCreation: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation even if the add-on is not free',
    }),
    confirmAddonDeletion: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation and delete the add-on directly',
    }),
    confirmApplicationDeletion: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation and delete the application directly',
    }),
    confirmTcpRedirCreation: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation even if the TCP redirection is not free',
    }),
    jsonFormat: cliparse.flag('json', { aliases: ['j'], description: 'Show result in JSON format' }),
    humanJsonOutputFormat: getOutputFormatOption(),
    tag: cliparse.option('tag', {
      required: true,
      metavar: 'tag',
      description: 'A tag',
      parser: Parsers.tag,
    }),
    tags: cliparse.option('tags', {
      required: true,
      metavar: 'tags',
      description: 'List of tags, separated by a comma',
      parser: Parsers.tags,
    }),
    optTags: cliparse.option('tags', {
      metavar: 'tags',
      description: 'List of tags, separated by a comma',
      parser: Parsers.tags,
    }),
    optIpAddress: cliparse.option('ip', {
      required: false,
      metavar: 'ip_address',
      description: 'An IP address',
      parser: Parsers.ipAddress,
    }),
    optPortNumber: cliparse.option('port', {
      required: false,
      metavar: 'port_number',
      description: 'A port number',
      parser: Parsers.portNumber,
    }),
  };

  // ACCESSLOGS COMMAND
  const accesslogsCommand = cliparse.command('accesslogs', {
    description: 'Fetch access logs',
    options: [opts.alias, opts.appIdOrName, opts.logsFormat, opts.before, opts.after, opts.addonId],
  }, accesslogsModule.accessLogs);

  // ACTIVITY COMMAND
  const activityCommand = cliparse.command('activity', {
    description: 'Show last deployments of an application',
    options: [opts.alias, opts.appIdOrName, opts.follow, opts.showAllActivity, opts.activityFormat],
  }, activity.activity);

  // ADDON COMMANDS
  const addonCreateCommand = cliparse.command('create', {
    description: 'Create an add-on',
    args: [args.addonProvider, args.addonName],
    options: [opts.linkAddon, opts.confirmAddonCreation, opts.addonPlan, opts.addonRegion, opts.addonVersion, opts.addonOptions, opts.humanJsonOutputFormat],
  }, addon.create);
  const addonDeleteCommand = cliparse.command('delete', {
    description: 'Delete an add-on',
    args: [args.addonIdOrName],
    options: [opts.confirmAddonDeletion],
  }, addon.deleteAddon);
  const addonRenameCommand = cliparse.command('rename', {
    description: 'Rename an add-on',
    args: [args.addonIdOrName, args.addonName],
  }, addon.rename);
  const addonShowProviderCommand = cliparse.command('show', {
    description: 'Show information about an add-on provider',
    args: [args.addonProvider],
  }, addon.showProvider);
  const addonProvidersCommand = cliparse.command('providers', {
    description: 'List available add-on providers',
    commands: [addonShowProviderCommand],
    options: [opts.humanJsonOutputFormat],
  }, addon.listProviders);
  const addonEnvCommand = cliparse.command('env', {
    description: 'List environment variables for an add-on',
    options: [opts.envFormat],
    args: [opts.addonId],
  }, addon.env);
  const addonListCommand = cliparse.command('list', {
    description: 'List available add-ons',
    options: [opts.humanJsonOutputFormat],
  }, addon.list);

  const addonCommands = cliparse.command('addon', {
    description: 'Manage add-ons',
    options: [opts.orgaIdOrName],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [addonCreateCommand, addonDeleteCommand, addonRenameCommand, addonListCommand, addonProvidersCommand, addonEnvCommand],
  }, addon.list);

  // APPLICATIONS COMMAND
  const applicationsListRemoteCommand = cliparse.command('list', {
    description: 'List all applications',
    options: [opts.orgaIdOrName, opts.humanJsonOutputFormat],
  }, applications.listAll);
  const applicationsCommand = cliparse.command('applications', {
    description: 'List linked applications',
    privateOptions: [opts.onlyAliases, opts.jsonFormat],
    commands: [applicationsListRemoteCommand],
  }, applications.list);

  // CANCEL DEPLOY COMMAND
  const cancelDeployCommand = cliparse.command('cancel-deploy', {
    description: 'Cancel an ongoing deployment',
    options: [opts.alias, opts.appIdOrName],
  }, cancelDeploy.cancelDeploy);

  // CONFIG COMMAND
  const configGetCommand = cliparse.command('get', {
    description: 'Display the current configuration',
    args: [args.configurationName],
  }, config.get);
  const configSetCommand = cliparse.command('set', {
    description: 'Edit one configuration setting',
    args: [args.configurationName, args.configurationValue],
  }, config.set);
  const configUpdateCommand = cliparse.command('update', {
    description: 'Edit multiple configuration settings at once',
    options: ApplicationConfiguration.getUpdateOptions(),
  }, config.update);
  const configCommands = cliparse.command('config', {
    description: 'Display or edit the configuration of your application',
    options: [opts.alias, opts.appIdOrName],
    commands: [configGetCommand, configSetCommand, configUpdateCommand],
  }, config.get);

  // CREATE COMMAND
  const appCreateCommand = cliparse.command('create', {
    description: 'Create an application',
    args: [args.appNameCreation],
    options: [opts.instanceType, opts.orgaIdOrName, opts.aliasCreation, opts.region, opts.github, opts.taskCommand, opts.humanJsonOutputFormat],
  }, create.create);

  // CURL COMMAND
  // NOTE: it's just here for documentation purposes, look at the bottom of the file for the real "clever curl" command
  const curlCommand = cliparse.command('curl', {
    description: 'Query Clever Cloud\'s API using Clever Tools credentials',
  }, () => null);

  // DELETE COMMAND
  const deleteCommand = cliparse.command('delete', {
    description: 'Delete an application',
    options: [opts.alias, opts.appIdOrName, opts.confirmApplicationDeletion],
  }, deleteCommandModule.deleteApp);

  // DEPLOY COMMAND
  const deployCommand = cliparse.command('deploy', {
    description: 'Deploy an application',
    options: [opts.alias, opts.branch, opts.gitTag, opts.quiet, opts.forceDeploy, opts.followDeployLogs, opts.sameCommitPolicy, opts.exitOnDeploy],
  }, deploy.deploy);

  // DIAG COMMAND
  const diagCommand = cliparse.command('diag', {
    description: 'Diagnose the current installation (prints various informations for support)',
    args: [],
    options: [opts.humanJsonOutputFormat],
  }, diag.diag);

  // DOMAIN COMMANDS
  const domainCreateCommand = cliparse.command('add', {
    description: 'Add a domain name to an application',
    args: [args.fqdn],
    options: [opts.alias, opts.appIdOrName],
  }, domain.add);
  const domainRemoveCommand = cliparse.command('rm', {
    description: 'Remove a domain name from an application',
    args: [args.fqdn],
    options: [opts.alias, opts.appIdOrName],
  }, domain.rm);
  const domainSetFavouriteCommand = cliparse.command('set', {
    description: 'Set the favourite domain for an application',
    args: [args.fqdn],
  }, domain.setFavourite);
  const domainUnsetFavouriteCommand = cliparse.command('unset', {
    description: 'Unset the favourite domain for an application',
  }, domain.unsetFavourite);
  const domainFavouriteCommands = cliparse.command('favourite', {
    description: 'Manage the favourite domain name for an application',
    options: [opts.alias, opts.appIdOrName],
    commands: [domainSetFavouriteCommand, domainUnsetFavouriteCommand],
  }, domain.getFavourite);
  const domainDiagApplicationCommand = cliparse.command('diag', {
    description: 'Check if domains associated to a specific app are properly configured',
    options: [opts.alias, opts.appIdOrName, opts.humanJsonOutputFormat, opts.domain],
  }, domain.diagApplication);
  const domainOverviewCommand = cliparse.command('overview', {
    description: 'Get an overview of all your domains (all orgas, all apps)',
    options: [opts.humanJsonOutputFormat, opts.domainOverviewFilter],
  }, domain.overview);
  const domainCommands = cliparse.command('domain', {
    description: 'Manage domain names for an application',
    privateOptions: [opts.alias, opts.appIdOrName],
    commands: [domainCreateCommand, domainFavouriteCommands, domainRemoveCommand, domainDiagApplicationCommand, domainOverviewCommand],
  }, domain.list);

  // DRAIN COMMANDS
  const drainCreateCommand = cliparse.command('create', {
    description: 'Create a drain',
    args: [args.drainType, args.drainUrl],
    options: [opts.drainUsername, opts.drainPassword, opts.drainAPIKey, opts.drainIndexPrefix, opts.drainSDParameters],
  }, drain.create);
  const drainRemoveCommand = cliparse.command('remove', {
    description: 'Remove a drain',
    args: [args.drainId],
  }, drain.rm);
  const drainEnableCommand = cliparse.command('enable', {
    description: 'Enable a drain',
    args: [args.drainId],
  }, drain.enable);
  const drainDisableCommand = cliparse.command('disable', {
    description: 'Disable a drain',
    args: [args.drainId],
  }, drain.disable);
  const drainCommands = cliparse.command('drain', {
    description: 'Manage drains',
    options: [opts.alias, opts.appIdOrName, opts.addonId],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [drainCreateCommand, drainRemoveCommand, drainEnableCommand, drainDisableCommand],
  }, drain.list);

  // ENV COMMANDS
  const envSetCommand = cliparse.command('set', {
    description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, env.set);
  const envRemoveCommand = cliparse.command('rm', {
    description: 'Remove an environment variable from an application',
    args: [args.envVariableName],
  }, env.rm);
  const envImportCommand = cliparse.command('import', {
    description: 'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, env.importEnv);
  const envImportVarsFromLocalEnvCommand = cliparse.command('import-vars', {
    description: 'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
    args: [args.envVariableNames],
  }, env.importVarsFromLocalEnv);
  const envCommands = cliparse.command('env', {
    description: 'Manage environment variables of an application',
    options: [opts.alias, opts.appIdOrName, opts.sourceableEnvVarsList],
    privateOptions: [opts.envFormat],
    commands: [envSetCommand, envRemoveCommand, envImportCommand, envImportVarsFromLocalEnvCommand],
  }, env.list);

  // EXPERIMENTAL FEATURES COMMAND
  const listFeaturesCommand = cliparse.command('list', {
    description: 'List available experimental features',
    options: [opts.humanJsonOutputFormat],
  }, features.list);
  const infoFeaturesCommand = cliparse.command('info', {
    description: 'Display info about an experimental feature',
    args: [args.featureId],
  }, features.info);
  const enableFeatureCommand = cliparse.command('enable', {
    description: 'Enable experimental features',
    args: [args.features],
  }, features.enable);
  const disableFeatureCommand = cliparse.command('disable', {
    description: 'Disable experimental features',
    args: [args.features],
  }, features.disable);
  const featuresCommands = cliparse.command('features', {
    description: 'Manage Clever Tools experimental features',
    commands: [enableFeatureCommand, disableFeatureCommand, listFeaturesCommand, infoFeaturesCommand],
  }, features.list);

  // KMS COMMANDS
  const kmsGetCommand = cliparse.command('get', {
    description: 'Get the value of a secret',
    args: [args.kmsSecret],
  }, kms.get);
  const kmsPatchCommand = cliparse.command('patch', {
    description: 'Patch an existing secret',
    args: [args.kmsSecret, args.kmsKeyValue],
  }, kms.patch);
  const kmsPutCommand = cliparse.command('put', {
    description: 'Set the value of a secret',
    args: [args.kmsSecret, args.kmsKeyValue],
  }, kms.put);
  const kmsCommands = cliparse.command('kms', {
    description: 'Manage secrets',
    options: [opts.humanJsonOutputFormat],
    commands: [kmsGetCommand, kmsPatchCommand, kmsPutCommand],
  }, kms.get);

  // KV COMMAND
  const kvRawCommand = cliparse.command('kv', {
    description: 'Send a raw command to a Materia KV or Redis® add-on',
    args: [args.kvIdOrName, args.kvRawCommand],
    options: [opts.orgaIdOrName, opts.humanJsonOutputFormat],
  }, kv.sendRawCommand);

  // LINK COMMAND
  const appLinkCommand = cliparse.command('link', {
    description: 'Link this repo to an existing application',
    args: [args.appIdOrName],
    options: [opts.aliasCreation, opts.orgaIdOrName],
  }, link.link);

  // LOGIN COMMAND
  const loginCommand = cliparse.command('login', {
    description: 'Login to Clever Cloud',
    options: [opts.loginToken, opts.loginSecret],
  }, login.login);

  // LOGOUT COMMAND
  const logoutCommand = cliparse.command('logout', {
    description: 'Logout from Clever Cloud',
  }, logout.logout);

  // LOGS COMMAND
  const logsCommand = cliparse.command('logs', {
    description: 'Fetch application logs, continuously',
    options: [opts.alias, opts.appIdOrName, opts.before, opts.after, opts.search, opts.deploymentId, opts.addonId, opts.logsFormat],
  }, logs.appLogs);

  // MAKE DEFAULT COMMAND
  const makeDefaultCommand = cliparse.command('make-default', {
    description: 'Make a linked application the default one',
    args: [args.alias],
  }, makeDefault.makeDefault);

  // NETWORK GROUP COMMANDS
  const ngCreateExternalPeerCommand = cliparse.command('external', {
    description: 'Create an external peer in a Network Group',
    args: [args.ngExternalPeerLabel, args.ngIdOrLabel, args.wgPublicKey],
  }, ng.createExternalPeer);
  const ngDeleteExternalPeerCommand = cliparse.command('external', {
    description: 'Delete an external peer from a Network Group',
    args: [args.ngExternalIdOrLabel, args.ngIdOrLabel],
  }, ng.deleteExternalPeer);
  const ngCreateCommand = cliparse.command('create', {
    description: 'Create a Network Group',
    args: [args.ngLabel],
    privateOptions: [opts.ngMembersIdsToLink, opts.ngDescription, opts.optTags],
    commands: [ngCreateExternalPeerCommand],
  }, ng.createNg);
  const ngDeleteCommand = cliparse.command('delete', {
    description: 'Delete a Network Group',
    args: [args.ngIdOrLabel],
    commands: [ngDeleteExternalPeerCommand],
  }, ng.deleteNg);
  const ngLinkCommand = cliparse.command('link', {
    description: 'Link an application or a database add-on by its ID to a Network Group',
    args: [args.ngAnyIdOrLabel, args.ngIdOrLabel],
  }, ng.linkToNg);
  const ngUnlinkCommand = cliparse.command('unlink', {
    description: 'Unlink an application or a database add-on by its ID from a Network Group',
    args: [args.ngAnyIdOrLabel, args.ngIdOrLabel],
  }, ng.unlinkFromNg);
  const ngGetCommand = cliparse.command('get', {
    description: 'Get details about a Network Group, a member or a peer',
    args: [args.ngAnyIdOrLabel],
    options: [opts.ngResourceType, opts.humanJsonOutputFormat],
  }, ng.get);
  const ngGetConfigCommand = cliparse.command('get-config', {
    description: 'Get the Wireguard configuration of a peer in a Network Group',
    args: [args.ngExternalIdOrLabel, args.ngIdOrLabel],
    options: [opts.humanJsonOutputFormat],
  }, ng.getPeerConfig);
  const ngSearchCommand = cliparse.command('search', {
    description: 'Search Network Groups, members or peers and get their details',
    args: [args.ngAnyIdOrLabel],
    options: [opts.ngResourceType, opts.humanJsonOutputFormat],
  }, ng.search);
  const networkGroupsCommand = cliparse.command('ng', {
    description: 'List Network Groups',
    options: [opts.orgaIdOrName],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [ngCreateCommand, ngDeleteCommand, ngLinkCommand, ngUnlinkCommand, ngGetCommand, ngGetConfigCommand, ngSearchCommand],
  }, ng.listNg);

  // NOTIFY-EMAIL COMMAND
  const addEmailNotificationCommand = cliparse.command('add', {
    description: 'Add a new email notification',
    options: [opts.notificationEventType, opts.notificationScope, opts.emailNotificationTarget],
    args: [args.notificationName],
  }, notifyEmail.add);
  const removeEmailNotificationCommand = cliparse.command('remove', {
    description: 'Remove an existing email notification',
    args: [args.notificationId],
  }, notifyEmail.remove);
  const emailNotificationsCommand = cliparse.command('notify-email', {
    description: 'Manage email notifications',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [addEmailNotificationCommand, removeEmailNotificationCommand],
  }, notifyEmail.list);

  // OPEN COMMAND
  const openCommand = cliparse.command('open', {
    description: 'Open an application in the Console',
    options: [opts.alias, opts.appIdOrName],
  }, open.open);

  // CONSOLE COMMAND
  const consoleCommand = cliparse.command('console', {
    description: 'Open an application in the Console',
    options: [opts.alias, opts.appIdOrName],
  }, consoleModule.openConsole);

  // PROFILE COMMAND
  const profileOpenCommand = cliparse.command('open', {
    description: 'Open your profile in the Console',
  }, profile.openProfile);
  const profileCommand = cliparse.command('profile', {
    description: 'Display the profile of the current user',
    options: [opts.humanJsonOutputFormat],
    commands: [profileOpenCommand],
  }, profile.profile);

  // PUBLISHED CONFIG COMMANDS
  const publishedConfigSetCommand = cliparse.command('set', {
    description: 'Add or update a published configuration item named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, publishedConfig.set);
  const publishedConfigRemoveCommand = cliparse.command('rm', {
    description: 'Remove a published configuration variable from an application',
    args: [args.envVariableName],
  }, publishedConfig.rm);
  const publishedConfigImportCommand = cliparse.command('import', {
    description: 'Load published configuration from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, publishedConfig.importEnv);
  const publishedConfigCommands = cliparse.command('published-config', {
    description: 'Manage the configuration made available to other applications by this application',
    options: [opts.alias, opts.appIdOrName],
    privateOptions: [opts.envFormat],
    commands: [publishedConfigSetCommand, publishedConfigRemoveCommand, publishedConfigImportCommand],
  }, publishedConfig.list);

  // RESTART COMMAND
  const restartCommand = cliparse.command('restart', {
    description: 'Start or restart an application',
    options: [opts.alias, opts.appIdOrName, opts.commit, opts.withoutCache, opts.quiet, opts.followDeployLogs, opts.exitOnDeploy],
  }, restart.restart);

  // SCALE COMMAND
  const scaleCommand = cliparse.command('scale', {
    description: 'Change scalability of an application',
    options: [opts.alias, opts.appIdOrName, opts.flavor, opts.minFlavor, opts.maxFlavor, opts.instances, opts.minInstances, opts.maxInstances, opts.buildFlavor],
  }, scale.scale);

  // SERVICE COMMANDS
  const serviceLinkAppCommand = cliparse.command('link-app', {
    description: 'Add an existing app as a dependency',
    args: [args.appIdOrName],
  }, service.linkApp);
  const serviceUnlinkAppCommand = cliparse.command('unlink-app', {
    description: 'Remove an app from the dependencies',
    args: [args.appIdOrName],
  }, service.unlinkApp);
  const serviceLinkAddonCommand = cliparse.command('link-addon', {
    description: 'Link an existing add-on to this application',
    args: [args.addonIdOrName],
  }, service.linkAddon);
  const serviceUnlinkAddonCommand = cliparse.command('unlink-addon', {
    description: 'Unlink an add-on from this application',
    args: [args.addonIdOrName],
  }, service.unlinkAddon);
  const serviceCommands = cliparse.command('service', {
    description: 'Manage service dependencies',
    options: [opts.alias, opts.appIdOrName, opts.onlyApps, opts.onlyAddons, opts.showAll],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [serviceLinkAppCommand, serviceUnlinkAppCommand, serviceLinkAddonCommand, serviceUnlinkAddonCommand],
  }, service.list);

  // SSH COMMAND
  const sshCommand = cliparse.command('ssh', {
    description: 'Connect to running instances through SSH',
    options: [opts.alias, opts.appIdOrName, opts.sshIdentityFile],
  }, ssh.ssh);

  // STATUS COMMAND
  const statusCommand = cliparse.command('status', {
    description: 'See the status of an application',
    options: [opts.alias, opts.appIdOrName, opts.humanJsonOutputFormat],
  }, status.status);

  // STOP COMMAND
  const stopCommand = cliparse.command('stop', {
    description: 'Stop a running application',
    options: [opts.alias, opts.appIdOrName],
  }, stop.stop);

  // TCP-REDIRS COMMAND
  const tcpRedirsListNamespacesCommand = cliparse.command('list-namespaces', {
    description: 'List the namespaces in which you can create new TCP redirections',
    options: [opts.humanJsonOutputFormat],
  }, tcpRedirs.listNamespaces);
  const tcpRedirsAddCommand = cliparse.command('add', {
    description: 'Add a new TCP redirection to the application',
    options: [opts.namespace, opts.confirmTcpRedirCreation],
  }, tcpRedirs.add);
  const tcpRedirsRemoveCommand = cliparse.command('remove', {
    description: 'Remove a TCP redirection from the application',
    options: [opts.namespace],
    args: [args.port],
  }, tcpRedirs.remove);
  const tcpRedirsCommands = cliparse.command('tcp-redirs', {
    description: 'Control the TCP redirections from reverse proxies to your application',
    options: [opts.alias, opts.appIdOrName],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [tcpRedirsListNamespacesCommand, tcpRedirsAddCommand, tcpRedirsRemoveCommand],
  }, tcpRedirs.list);

  // TOKENS COMMANDS
  const apiTokenCreateCommand = cliparse.command('create', {
    description: 'Create an API token',
    args: [args.apiTokenName],
    options: [opts.apiTokenExpiration, opts.humanJsonOutputFormat],
  }, tokens.create);
  const apiTokenRevokeCommand = cliparse.command('revoke', {
    description: 'Revoke an API token',
    args: [args.apiTokenId],
  }, tokens.revoke);
  const tokensCommands = cliparse.command('tokens', {
    description: `Manage API tokens to query Clever Cloud API from ${conf.AUTH_BRIDGE_HOST}`,
    commands: [apiTokenCreateCommand, apiTokenRevokeCommand],
    privateOptions: [opts.humanJsonOutputFormat],
  }, tokens.list);

  // UNLINK COMMAND
  const appUnlinkCommand = cliparse.command('unlink', {
    description: 'Unlink this repo from an existing application',
    args: [args.alias],
  }, unlink.unlink);

  // VERSION COMMAND
  const versionCommand = cliparse.command('version', {
    description: 'Display the clever-tools version',
    args: [],
  }, version.version);

  // WEBHOOKS COMMAND
  const addWebhookCommand = cliparse.command('add', {
    description: 'Register webhook to be called when events happen',
    options: [opts.webhookFormat, opts.notificationEventType, opts.notificationScope],
    args: [args.notificationName, args.webhookUrl],
  }, webhooks.add);
  const removeWebhookCommand = cliparse.command('remove', {
    description: 'Remove an existing webhook',
    args: [args.notificationId],
  }, webhooks.remove);
  const webhooksCommand = cliparse.command('webhooks', {
    description: 'Manage webhooks',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    privateOptions: [opts.humanJsonOutputFormat],
    commands: [addWebhookCommand, removeWebhookCommand],
  }, webhooks.list);

  // DATABASES COMMANDS
  const downloadBackupCommand = cliparse.command('download', {
    description: 'Download a database backup',
    args: [args.databaseId, args.backupId],
    options: [opts.output],
  }, database.downloadBackups);
  const backupsCommand = cliparse.command('backups', {
    description: 'List available database backups',
    args: [args.databaseId],
    options: [opts.orgaIdOrName, opts.humanJsonOutputFormat],
    commands: [
      downloadBackupCommand,
    ],
  }, database.listBackups);
  const databaseCommand = cliparse.command('database', {
    description: 'List available databases',
    commands: [backupsCommand],
  }, async () => {
    console.info('This command is not available, you can try the following commands:');
    console.info('clever database backups');
    console.info('clever database backups download');
  });

  // Patch help command description
  cliparseCommands.helpCommand.description = 'Display help about the Clever Cloud CLI';

  const commands = [
    accesslogsCommand,
    activityCommand,
    addonCommands,
    appCreateCommand,
    applicationsCommand,
    appLinkCommand,
    appUnlinkCommand,
    cancelDeployCommand,
    configCommands,
    curlCommand,
    databaseCommand,
    deleteCommand,
    deployCommand,
    diagCommand,
    domainCommands,
    drainCommands,
    emailNotificationsCommand,
    envCommands,
    featuresCommands,
    cliparseCommands.helpCommand,
    loginCommand,
    logoutCommand,
    logsCommand,
    makeDefaultCommand,
    openCommand,
    consoleCommand,
    profileCommand,
    publishedConfigCommands,
    restartCommand,
    scaleCommand,
    serviceCommands,
    sshCommand,
    statusCommand,
    stopCommand,
    tcpRedirsCommands,
    versionCommand,
    webhooksCommand,
  ];

  // Add experimental features only if they are enabled through the configuration file
  const featuresFromConf = await getFeatures();

  if (featuresFromConf.kms) {
    commands.push(colorizeExperimentalCommand(kmsCommands, 'kms'));
  }

  if (featuresFromConf.kv) {
    commands.push(colorizeExperimentalCommand(kvRawCommand, 'kv'));
  }

  if (featuresFromConf.ng) {
    commands.push(colorizeExperimentalCommand(networkGroupsCommand, 'ng'));
  }

  if (featuresFromConf.tokens) {
    commands.push(colorizeExperimentalCommand(tokensCommands, 'tokens'));
  }

  // CLI PARSER
  const cliParser = cliparse.cli({
    name: 'clever',
    description: 'CLI tool to manage Clever Cloud\'s data and products',
    version: getPackageJson().version,
    options: [opts.color, opts.updateNotifier, opts.verbose],
    helpCommand: false,
    commands: _sortBy(commands, 'name'),
  });

  // Make sure argv[0] is always "node"
  const cliArgs = process.argv;
  cliArgs[0] = 'node';
  cliparse.parse(cliParser, cliArgs);
}

// Right now, this is the only way to do this properly
// cliparse doesn't allow unknown options/arguments
if (process.argv[2] === 'curl') {
  curl();
}
else {
  run();
}
