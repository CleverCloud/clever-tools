#! /usr/bin/env node
'use strict';

function hasParam (param, paramValue) {
  const index = process.argv.indexOf(param);
  if (index === -1) {
    return false;
  }
  if (paramValue != null) {
    return process.argv[index + 1] === paramValue;
  }
  return true;
}

// These need to be set before Logger and other stuffs
if (hasParam('-v') || hasParam('--verbose')) {
  process.env.CLEVER_VERBOSE = '1';
}

// These need to be set before Logger and other stuffs
// Don't log anything in autocomplete mode
if (hasParam('--autocomplete-index')) {
  process.env.CLEVER_QUIET = '1';
}

// These need to be set before other stuffs
const colors = require('colors');
const colorExplicitFalse = hasParam('--no-color') || hasParam('--color', 'false');
const colorExplicitTrue = hasParam('--color', 'true');
if (colorExplicitFalse || (!process.stdout.isTTY && !colorExplicitTrue)) {
  colors.disable();
}

// These need to be set before Logger and other stuffs
const pkg = require('../package.json');
const updateNotifierModule = require('update-notifier');
const isRunThroughPackagedBinary = process.pkg != null;
const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
if (!updateNotifierExplicitFalse && !isRunThroughPackagedBinary) {
  updateNotifierModule({
    pkg,
    tagsUrl: 'https://api.github.com/repos/CleverCloud/clever-tools/tags',
  }).notify({
    getDetails () {
      const docsUrl = 'https://www.clever-cloud.com/doc/clever-tools/getting_started';
      return `\nPlease follow this link to update your clever-tools:\n${docsUrl}`;
    },
  });
}

const cliparse = require('cliparse');
const cliparseCommands = require('cliparse/src/command.js');
const _sortBy = require('lodash/sortBy.js');

const git = require('../src/models/git.js');
const Parsers = require('../src/parsers.js');
const handleCommandPromise = require('../src/command-promise-handler.js');
const Formatter = require('../src/models/format-string.js');
const { AVAILABLE_ZONES } = require('../src/models/application.js');
const { getOutputFormatOption, getSameCommitPolicyOption } = require('../src/command-options.js');

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

// Use this alias so we get less warnings in pkg build :p
const dynamicRequire = module.require.bind(module);

function lazyRequirePromiseModule (modulePath) {
  return function (name) {
    return function (...args) {
      const module = dynamicRequire(modulePath);
      const promise = module[name](...args);
      handleCommandPromise(promise);
    };
  };
}

function lazyRequire (modulePath) {
  return function (name) {
    return function (...args) {
      const module = dynamicRequire(modulePath);
      return module[name].apply(this, args);
    };
  };
}

const Addon = lazyRequire('../src/models/addon.js');
const Application = lazyRequire('../src/models/application.js');
const ApplicationConfiguration = lazyRequire('../src/models/application_configuration.js');
const Drain = lazyRequire('../src/models/drain.js');
const Notification = lazyRequire('../src/models/notification.js');
const Organisation = lazyRequire('../src/models/organisation.js');
const NetworkGroup = lazyRequire('../src/models/networkgroup.js');

function run () {

  // ARGUMENTS
  const args = {
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
      complete: Drain('listDrainTypes'),
    }),
    drainUrl: cliparse.argument('drain-url', { description: 'Drain URL' }),
    fqdn: cliparse.argument('fqdn', { description: 'Domain name of the application' }),
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
        return cliparse.autocomplete.words(ApplicationConfiguration('listAvailableIds')());
      },
    }),
    configurationValue: cliparse.argument('configuration-value', { description: 'The new value of the configuration' }),
    ngId: cliparse.argument('ng-id', { description: 'The Network Group ID' }),
    ngIdOrLabel: cliparse.argument('ng', {
      description: 'Network Group ID or label',
      parser: Parsers.ngIdOrLabel,
    }),
  };

  // OPTIONS
  const opts = {
    sourceableEnvVarsList: cliparse.flag('add-export', { description: 'Display sourceable env variables setting' }),
    accesslogsFormat: getOutputFormatOption(['simple', 'extended', 'clf']),
    addonEnvFormat: getOutputFormatOption(['shell']),
    logsFormat: getOutputFormatOption(['json-stream']),
    accesslogsFollow: cliparse.flag('follow', {
      aliases: ['f'],
      description: 'Display access logs continuously (ignores before/until, after/since)',
    }),
    importAsJson: cliparse.flag('json', {
      description: 'Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects)',
    }),
    addonId: cliparse.option('addon', { metavar: 'addon_id', description: 'Add-on ID' }),
    after: cliparse.option('after', {
      metavar: 'after',
      aliases: ['since'],
      parser: Parsers.date,
      description: 'Fetch logs after this date/time (ISO8601)',
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
      complete: Application('listAvailableAliases'),
    }),
    naturalName: cliparse.flag('natural-name', {
      aliases: ['n'],
      description: 'Show the application names or aliases if possible',
    }),
    before: cliparse.option('before', {
      metavar: 'before',
      aliases: ['until'],
      parser: Parsers.date,
      description: 'Fetch logs before this date/time (ISO8601 date or duration, positive number in seconds or duration Ex: 1h)',
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
      complete: Organisation('completeNamespaces'),
    }),
    notificationEventType: cliparse.option('event', {
      metavar: 'type',
      description: 'Restrict notifications to specific event types',
      complete: Notification('listMetaEvents'),
      parser: Parsers.commaSeparated,
    }),
    flavor: cliparse.option('flavor', {
      metavar: 'flavor',
      parser: Parsers.flavor,
      description: 'The instance size of your application',
      complete () {
        return cliparse.autocomplete.words(Application('listAvailableFlavors')());
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
      complete: Application('listAvailableAliases'),
    }),
    listAllNotifications: cliparse.flag('list-all', { description: 'List all notifications for your user or for an organisation with the \'--org\' option' }),
    maxFlavor: cliparse.option('max-flavor', {
      metavar: 'maxflavor',
      parser: Parsers.flavor,
      description: 'The maximum instance size of your application',
      complete () {
        return cliparse.autocomplete.words(Application('listAvailableFlavors')());
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
        return cliparse.autocomplete.words(Application('listAvailableFlavors')());
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
      complete: Addon('completePlan'),
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
      complete: Addon('completeRegion'),
    }),
    addonVersion: cliparse.option('addon-version', {
      metavar: 'addon-version',
      description: 'The version to use for the add-on',
    }),
    addonOptions: cliparse.option('option', {
      metavar: 'option',
      description: 'Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options',
    }),
    region: cliparse.option('region', {
      aliases: ['r'],
      default: 'par',
      metavar: 'zone',
      description: `Region, can be ${AVAILABLE_ZONES.map((name) => `'${name}'`).join(', ')}`,
      complete: Application('listAvailableZones'),
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
      complete: Application('listAvailableTypes'),
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
      description: '(ElasticSearch drains) Index prefix',
      default: 'logstash-<YYYY-MM-DD>',
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
    ngLabel: cliparse.option('label', {
      required: true,
      metavar: 'ng_label',
      description: 'Network Group label, also used for DNS context',
    }),
    ngIdOrLabel: cliparse.option('ng', {
      required: true,
      metavar: 'ng',
      description: 'Network Group ID or label',
      parser: Parsers.ngIdOrLabel,
      // complete: NetworkGroup('xxx'),
    }),
    ngDescription: cliparse.option('description', {
      required: true,
      metavar: 'ng_description',
      description: 'Network Group description',
    }),
    ngMemberId: cliparse.option('member-id', {
      aliases: ['m'],
      required: true,
      metavar: 'member_id',
      description: `The member ID: an app ID (e.g.: ${Formatter.formatCode('app_xxx')}), add-on ID (e.g.: ${Formatter.formatCode('addon_xxx')}) or external node category ID`,
      // complete: NetworkGroup('xxx'),
    }),
    ngMemberDomainName: cliparse.option('domain-name', {
      required: true,
      metavar: 'domain_name',
      description: `Member name used in the ${Formatter.formatUrl('<memberName>.m.<ngID>.ng.clever-cloud.com', false)} domain name alias`,
    }),
    ngPeerId: cliparse.option('peer-id', {
      required: true,
      metavar: 'peer_id',
      description: 'The peer ID',
      // complete: NetworkGroup('xxx'),
    }),
    ngPeerRole: cliparse.option('role', {
      required: true,
      metavar: 'peer_role',
      description: `The peer role, (${Formatter.formatString('client')} or ${Formatter.formatString('server')})`,
      parser: Parsers.ngPeerRole,
      complete: NetworkGroup('listAvailablePeerRoles'),
    }),
    // FIXME: Add "internal" member type
    ngMemberType: cliparse.option('type', {
      required: true,
      metavar: 'member_type',
      description: `The member type (${Formatter.formatString('application')}, ${Formatter.formatString('addon')} or ${Formatter.formatString('external')})`,
      parser: Parsers.ngMemberType,
      complete: NetworkGroup('listAvailableMemberTypes'),
    }),
    ngMemberLabel: cliparse.option('label', {
      required: true,
      metavar: 'member_label',
      description: 'Network Group member label',
    }),
    ngNodeCategoryId: cliparse.option('node-category-id', {
      required: true,
      aliases: ['c'],
      metavar: 'node_category_id',
      description: 'The external node category ID',
      // complete: NetworkGroup('xxx'),
    }),
    ngPeerLabel: cliparse.option('label', {
      required: true,
      metavar: 'peer_label',
      description: 'Network Group peer label',
    }),
    ngPeerParentMemberId: cliparse.option('parent', {
      required: true,
      metavar: 'member_id',
      description: 'Network Group peer category ID (parent member ID)',
      // complete: NetworkGroup('xxx'),
    }),
    optNgIdOrLabel: cliparse.option('ng', {
      required: false,
      metavar: 'ng',
      description: 'Network Group ID or label',
      parser: Parsers.ngIdOrLabel,
      // complete: NetworkGroup('xxx'),
    }),
    optNgMemberLabel: cliparse.option('label', {
      required: false,
      metavar: 'member_label',
      description: 'The member label',
    }),
    optNgNodeCategoryId: cliparse.option('node-category-id', {
      required: false,
      aliases: ['c'],
      metavar: 'node_category_id',
      description: 'The external node category ID',
      // complete: NetworkGroup('xxx'),
    }),
    optNgPeerId: cliparse.option('peer-id', {
      required: false,
      metavar: 'peer_id',
      description: 'The peer ID',
      // complete: NetworkGroup('xxx'),
    }),
    optNgPeerRole: cliparse.option('role', {
      required: false,
      default: 'client',
      metavar: 'peer_role',
      description: `The peer role, (${Formatter.formatString('client')} or ${Formatter.formatString('server')})`,
      parser: Parsers.ngPeerRole,
      complete: NetworkGroup('listAvailablePeerRoles'),
    }),
    optNgSearchAppId: cliparse.option('app-id', {
      required: false,
      metavar: 'app_id',
      description: 'The app ID to search',
      // complete: NetworkGroup('xxx'),
    }),
    wgPublicKey: cliparse.option('public-key', {
      required: true,
      metavar: 'public_key',
      description: 'A WireGuard® public key',
    }),
    optWgPrivateKey: cliparse.option('private-key', {
      required: false,
      metavar: 'private_key',
      description: 'A WireGuard® private key',
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
  const accesslogsModule = lazyRequirePromiseModule('../src/commands/accesslogs.js');
  const accesslogsCommand = cliparse.command('accesslogs', {
    description: 'Fetch access logs',
    options: [opts.alias, opts.appIdOrName, opts.accesslogsFormat, opts.before, opts.after, opts.accesslogsFollow, opts.addonId],
  }, accesslogsModule('accessLogs'));

  // ACTIVITY COMMAND
  const activity = lazyRequirePromiseModule('../src/commands/activity.js');
  const activityCommand = cliparse.command('activity', {
    description: 'Show last deployments of an application',
    options: [opts.alias, opts.appIdOrName, opts.follow, opts.showAllActivity],
  }, activity('activity'));

  // ADDON COMMANDS
  const addon = lazyRequirePromiseModule('../src/commands/addon.js');
  const addonCreateCommand = cliparse.command('create', {
    description: 'Create an add-on',
    args: [args.addonProvider, args.addonName],
    options: [opts.linkAddon, opts.confirmAddonCreation, opts.addonPlan, opts.addonRegion, opts.addonVersion, opts.addonOptions, opts.humanJsonOutputFormat],
  }, addon('create'));
  const addonDeleteCommand = cliparse.command('delete', {
    description: 'Delete an add-on',
    args: [args.addonIdOrName],
    options: [opts.confirmAddonDeletion],
  }, addon('delete'));
  const addonRenameCommand = cliparse.command('rename', {
    description: 'Rename an add-on',
    args: [args.addonIdOrName, args.addonName],
  }, addon('rename'));
  const addonShowProviderCommand = cliparse.command('show', {
    description: 'Show information about an add-on provider',
    args: [args.addonProvider],
  }, addon('showProvider'));
  const addonProvidersCommand = cliparse.command('providers', {
    description: 'List available add-on providers',
    commands: [addonShowProviderCommand],
  }, addon('listProviders'));
  const addonEnvCommand = cliparse.command('env', {
    description: 'List environment variables for an add-on',
    options: [opts.addonEnvFormat],
    args: [opts.addonId],
  }, addon('env'));
  const addonListCommand = cliparse.command('list', {
    description: 'List available add-ons',
    options: [opts.humanJsonOutputFormat],
  }, addon('list'));

  const addonCommands = cliparse.command('addon', {
    description: 'Manage add-ons',
    options: [opts.orgaIdOrName],
    commands: [addonCreateCommand, addonDeleteCommand, addonRenameCommand, addonListCommand, addonProvidersCommand, addonEnvCommand],
  }, addon('list'));

  // APPLICATIONS COMMAND
  const applications = lazyRequirePromiseModule('../src/commands/applications.js');
  const applicationsCommand = cliparse.command('applications', {
    description: 'List linked applications',
    options: [opts.onlyAliases, opts.jsonFormat],
  }, applications('list'));

  // CANCEL DEPLOY COMMAND
  const cancelDeploy = lazyRequirePromiseModule('../src/commands/cancel-deploy.js');
  const cancelDeployCommand = cliparse.command('cancel-deploy', {
    description: 'Cancel an ongoing deployment',
    options: [opts.alias, opts.appIdOrName],
  }, cancelDeploy('cancelDeploy'));

  // CONFIG COMMAND
  const config = lazyRequirePromiseModule('../src/commands/config.js');
  const configGetCommand = cliparse.command('get', {
    description: 'Display the current configuration',
    args: [args.configurationName],
  }, config('get'));
  const configSetCommand = cliparse.command('set', {
    description: 'Edit one configuration setting',
    args: [args.configurationName, args.configurationValue],
  }, config('set'));
  const configUpdateCommand = cliparse.command('update', {
    description: 'Edit multiple configuration settings at once',
    options: ApplicationConfiguration('getUpdateOptions')(),
  }, config('update'));
  const configCommands = cliparse.command('config', {
    description: 'Display or edit the configuration of your application',
    options: [opts.alias, opts.appIdOrName],
    commands: [configGetCommand, configSetCommand, configUpdateCommand],
  }, config('get'));

  // CREATE COMMAND
  const create = lazyRequirePromiseModule('../src/commands/create.js');
  const appCreateCommand = cliparse.command('create', {
    description: 'Create an application',
    args: [args.appNameCreation],
    options: [opts.instanceType, opts.orgaIdOrName, opts.aliasCreation, opts.region, opts.github, opts.humanJsonOutputFormat, opts.taskCommand],
  }, create('create'));

  // CURL COMMAND
  // NOTE: it's just here for documentation purposes, look at the bottom of the file for the real "clever curl" command
  const curlCommand = cliparse.command('curl', {
    description: 'Query Clever Cloud\'s API using Clever Tools credentials',
  }, () => null);

  // DELETE COMMAND
  const deleteCommandModule = lazyRequirePromiseModule('../src/commands/delete.js');
  const deleteCommand = cliparse.command('delete', {
    description: 'Delete an application',
    options: [opts.alias, opts.appIdOrName, opts.confirmApplicationDeletion],
  }, deleteCommandModule('deleteApp'));

  // DEPLOY COMMAND
  const deploy = lazyRequirePromiseModule('../src/commands/deploy.js');
  const deployCommand = cliparse.command('deploy', {
    description: 'Deploy an application',
    options: [opts.alias, opts.branch, opts.gitTag, opts.quiet, opts.forceDeploy, opts.followDeployLogs, opts.sameCommitPolicy],
  }, deploy('deploy'));

  // DIAG COMMAND
  const diag = lazyRequirePromiseModule('../src/commands/diag.js');
  const diagCommand = cliparse.command('diag', {
    description: 'Diagnose the current installation (prints various informations for support)',
    args: [],
  }, diag('diag'));

  // DOMAIN COMMANDS
  const domain = lazyRequirePromiseModule('../src/commands/domain.js');
  const domainCreateCommand = cliparse.command('add', {
    description: 'Add a domain name to an application',
    args: [args.fqdn],
  }, domain('add'));
  const domainRemoveCommand = cliparse.command('rm', {
    description: 'Remove a domain name from an application',
    args: [args.fqdn],
  }, domain('rm'));
  const domainSetFavouriteCommand = cliparse.command('set', {
    description: 'Set the favourite domain for an application',
    args: [args.fqdn],
  }, domain('setFavourite'));
  const domainUnsetFavouriteCommand = cliparse.command('unset', {
    description: 'Unset the favourite domain for an application',
  }, domain('unsetFavourite'));
  const domainFavouriteCommands = cliparse.command('favourite', {
    description: 'Manage the favourite domain name for an application',
    commands: [domainSetFavouriteCommand, domainUnsetFavouriteCommand],
  }, domain('getFavourite'));
  const domainCommands = cliparse.command('domain', {
    description: 'Manage domain names for an application',
    options: [opts.alias, opts.appIdOrName],
    commands: [domainCreateCommand, domainFavouriteCommands, domainRemoveCommand],
  }, domain('list'));

  // DRAIN COMMANDS
  const drain = lazyRequirePromiseModule('../src/commands/drain.js');
  const drainCreateCommand = cliparse.command('create', {
    description: 'Create a drain',
    args: [args.drainType, args.drainUrl],
    options: [opts.addonId, opts.drainUsername, opts.drainPassword, opts.drainAPIKey, opts.drainIndexPrefix, opts.drainSDParameters],
  }, drain('create'));
  const drainRemoveCommand = cliparse.command('remove', {
    description: 'Remove a drain',
    args: [args.drainId],
  }, drain('rm'));
  const drainEnableCommand = cliparse.command('enable', {
    description: 'Enable a drain',
    args: [args.drainId],
  }, drain('enable'));
  const drainDisableCommand = cliparse.command('disable', {
    description: 'Disable a drain',
    args: [args.drainId],
  }, drain('disable'));
  const drainCommands = cliparse.command('drain', {
    description: 'Manage drains',
    options: [opts.alias, opts.appIdOrName, opts.addonId],
    commands: [drainCreateCommand, drainRemoveCommand, drainEnableCommand, drainDisableCommand],
  }, drain('list'));

  // ENV COMMANDS
  const env = lazyRequirePromiseModule('../src/commands/env.js');
  const envSetCommand = cliparse.command('set', {
    description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, env('set'));
  const envRemoveCommand = cliparse.command('rm', {
    description: 'Remove an environment variable from an application',
    args: [args.envVariableName],
  }, env('rm'));
  const envImportCommand = cliparse.command('import', {
    description: 'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, env('importEnv'));
  const envImportVarsFromLocalEnvCommand = cliparse.command('import-vars', {
    description: 'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
    args: [args.envVariableNames],
  }, env('importVarsFromLocalEnv'));
  const envCommands = cliparse.command('env', {
    description: 'Manage environment variables of an application',
    options: [opts.alias, opts.appIdOrName, opts.sourceableEnvVarsList],
    commands: [envSetCommand, envRemoveCommand, envImportCommand, envImportVarsFromLocalEnvCommand],
  }, env('list'));

  // LINK COMMAND
  const link = lazyRequirePromiseModule('../src/commands/link.js');
  const appLinkCommand = cliparse.command('link', {
    description: 'Link this repo to an existing application',
    args: [args.appIdOrName],
    options: [opts.aliasCreation, opts.orgaIdOrName],
  }, link('link'));

  // LOGIN COMMAND
  const login = lazyRequirePromiseModule('../src/commands/login.js');
  const loginCommand = cliparse.command('login', {
    description: 'Login to Clever Cloud',
    options: [opts.loginToken, opts.loginSecret],
  }, login('login'));

  // LOGOUT COMMAND
  const logout = lazyRequirePromiseModule('../src/commands/logout.js');
  const logoutCommand = cliparse.command('logout', {
    description: 'Logout from Clever Cloud',
  }, logout('logout'));

  // LOGS COMMAND
  const logs = lazyRequirePromiseModule('../src/commands/logs.js');
  const logsCommand = cliparse.command('logs', {
    description: 'Fetch application logs, continuously',
    options: [opts.alias, opts.appIdOrName, opts.before, opts.after, opts.search, opts.deploymentId, opts.addonId, opts.logsFormat],
  }, logs('appLogs'));

  // MAKE DEFAULT COMMAND
  const makeDefault = lazyRequirePromiseModule('../src/commands/makeDefault.js');
  const makeDefaultCommand = cliparse.command('make-default', {
    description: 'Make a linked application the default one',
    args: [args.alias],
  }, makeDefault('makeDefault'));

  // NETWORK GROUPS COMMANDS
  const networkgroups = lazyRequirePromiseModule('../src/commands/networkgroups/commands.js');

  // network group category - start
  const networkGroupsListCommand = cliparse.command('list', {
    description: 'List Network Groups with their labels',
    options: [opts.jsonFormat],
  }, networkgroups('listNetworkGroups'));
  const networkGroupsCreateCommand = cliparse.command('create', {
    description: 'Create a Network Group',
    options: [opts.ngLabel, opts.ngDescription, opts.optTags, opts.jsonFormat],
  }, networkgroups('createNg'));
  const networkGroupsDeleteCommand = cliparse.command('delete', {
    description: 'Delete a Network Group',
    options: [opts.ngIdOrLabel],
  }, networkgroups('deleteNg'));
  // network group category - end

  // member category - start
  const networkGroupsMemberListCommand = cliparse.command('list', {
    description: 'List members of a Network Group',
    // Add option opts.optNgSearchAppId ?
    options: [opts.ngIdOrLabel, opts.naturalName, opts.jsonFormat],
  }, networkgroups('listMembers'));
  const networkGroupsMemberGetCommand = cliparse.command('get', {
    description: 'Get a Network Group member\'s details',
    options: [opts.ngIdOrLabel, opts.ngMemberId, opts.naturalName, opts.jsonFormat],
  }, networkgroups('getMember'));
  const networkGroupsMemberAddCommand = cliparse.command('add', {
    description: 'Add an app or add-on as a Network Group member',
    options: [opts.ngIdOrLabel, opts.ngMemberId, opts.ngMemberType, opts.ngMemberDomainName, opts.optNgMemberLabel],
  }, networkgroups('addMember'));
  const networkGroupsMemberRemoveCommand = cliparse.command('remove', {
    description: 'Remove an app or add-on from a Network Group',
    options: [opts.ngIdOrLabel, opts.ngMemberId],
  }, networkgroups('removeMember'));

  const networkGroupsMembersCategoryCommand = cliparse.command('members', {
    description: 'List commands for interacting with Network Group members',
    commands: [networkGroupsMemberListCommand, networkGroupsMemberGetCommand, networkGroupsMemberAddCommand, networkGroupsMemberRemoveCommand],
  });
  // member category - end

  // peer category - start
  const networkGroupsPeerListCommand = cliparse.command('list', {
    description: 'List peers of a Network Group',
    options: [opts.ngIdOrLabel, opts.jsonFormat],
  }, networkgroups('listPeers'));
  const networkGroupsPeerGetCommand = cliparse.command('get', {
    description: 'Get a Network Group peer\'s details',
    options: [opts.ngIdOrLabel, opts.ngPeerId, opts.jsonFormat],
  }, networkgroups('getPeer'));
  const networkGroupsPeerAddCommand = cliparse.command('add-external', {
    description: 'Add an external node as a Network Group peer',
    options: [opts.ngIdOrLabel, opts.ngPeerRole, opts.wgPublicKey, opts.ngPeerLabel, opts.ngPeerParentMemberId],
  }, networkgroups('addExternalPeer'));
  const networkGroupsPeerRemoveExternalCommand = cliparse.command('remove-external', {
    description: 'Remove an external node from a Network Group',
    options: [opts.ngIdOrLabel, opts.ngPeerId],
  }, networkgroups('removeExternalPeer'));

  const networkGroupsPeersCategoryCommand = cliparse.command('peers', {
    description: 'List commands for interacting with Network Group peers',
    commands: [networkGroupsPeerListCommand, networkGroupsPeerGetCommand, networkGroupsPeerAddCommand, networkGroupsPeerRemoveExternalCommand],
  });
  // peer category - end

  // eslint-disable-next-line no-unused-vars
  const networkGroupsCommand = cliparse.command('networkgroups', {
    description: 'List Network Group commands',
    options: [opts.orgaIdOrName, opts.alias],
    commands: [networkGroupsListCommand, networkGroupsCreateCommand, networkGroupsDeleteCommand, networkGroupsMembersCategoryCommand, networkGroupsPeersCategoryCommand],
  });
  // eslint-disable-next-line no-unused-vars
  const ngCommand = cliparse.command('ng', {
    description: `Alias for ${Formatter.formatCommand('clever networkgroups')}`,
    options: [opts.orgaIdOrName, opts.alias],
    commands: [networkGroupsListCommand, networkGroupsCreateCommand, networkGroupsDeleteCommand, networkGroupsMembersCategoryCommand, networkGroupsPeersCategoryCommand],
  });

  // NOTIFY-EMAIL COMMAND
  const notifyEmail = lazyRequirePromiseModule('../src/commands/notify-email.js');
  const addEmailNotificationCommand = cliparse.command('add', {
    description: 'Add a new email notification',
    options: [opts.notificationEventType, opts.notificationScope, opts.emailNotificationTarget],
    args: [args.notificationName],
  }, notifyEmail('add'));
  const removeEmailNotificationCommand = cliparse.command('remove', {
    description: 'Remove an existing email notification',
    args: [args.notificationId],
  }, notifyEmail('remove'));
  const emailNotificationsCommand = cliparse.command('notify-email', {
    description: 'Manage email notifications',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    commands: [addEmailNotificationCommand, removeEmailNotificationCommand],
  }, notifyEmail('list'));

  // OPEN COMMAND
  const open = lazyRequirePromiseModule('../src/commands/open.js');
  const openCommand = cliparse.command('open', {
    description: 'Open an application in your browser',
    options: [opts.alias, opts.appIdOrName],
  }, open('open'));

  // CONSOLE COMMAND
  const consoleModule = lazyRequirePromiseModule('../src/commands/console.js');
  const consoleCommand = cliparse.command('console', {
    description: 'Open an application in the Console',
    options: [opts.alias, opts.appIdOrName],
  }, consoleModule('openConsole'));

  // PROFILE COMMAND
  const profile = lazyRequirePromiseModule('../src/commands/profile.js');
  const profileCommand = cliparse.command('profile', {
    description: 'Display the profile of the current user',
  }, profile('profile'));

  // PUBLISHED CONFIG COMMANDS
  const publishedConfig = lazyRequirePromiseModule('../src/commands/published-config.js');
  const publishedConfigSetCommand = cliparse.command('set', {
    description: 'Add or update a published configuration item named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, publishedConfig('set'));
  const publishedConfigRemoveCommand = cliparse.command('rm', {
    description: 'Remove a published configuration variable from an application',
    args: [args.envVariableName],
  }, publishedConfig('rm'));
  const publishedConfigImportCommand = cliparse.command('import', {
    description: 'Load published configuration from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, publishedConfig('importEnv'));
  const publishedConfigCommands = cliparse.command('published-config', {
    description: 'Manage the configuration made available to other applications by this application',
    options: [opts.alias, opts.appIdOrName],
    commands: [publishedConfigSetCommand, publishedConfigRemoveCommand, publishedConfigImportCommand],
  }, publishedConfig('list'));

  // RESTART COMMAND
  const restart = lazyRequirePromiseModule('../src/commands/restart.js');
  const restartCommand = cliparse.command('restart', {
    description: 'Start or restart an application',
    options: [opts.alias, opts.commit, opts.withoutCache, opts.quiet, opts.followDeployLogs],
  }, restart('restart'));

  // SCALE COMMAND
  const scale = lazyRequirePromiseModule('../src/commands/scale.js');
  const scaleCommand = cliparse.command('scale', {
    description: 'Change scalability of an application',
    options: [opts.alias, opts.appIdOrName, opts.flavor, opts.minFlavor, opts.maxFlavor, opts.instances, opts.minInstances, opts.maxInstances, opts.buildFlavor],
  }, scale('scale'));

  // SERVICE COMMANDS
  const service = lazyRequirePromiseModule('../src/commands/service.js');
  const serviceLinkAppCommand = cliparse.command('link-app', {
    description: 'Add an existing app as a dependency',
    args: [args.appIdOrName],
  }, service('linkApp'));
  const serviceUnlinkAppCommand = cliparse.command('unlink-app', {
    description: 'Remove an app from the dependencies',
    args: [args.appIdOrName],
  }, service('unlinkApp'));
  const serviceLinkAddonCommand = cliparse.command('link-addon', {
    description: 'Link an existing add-on to this application',
    args: [args.addonIdOrName],
  }, service('linkAddon'));
  const serviceUnlinkAddonCommand = cliparse.command('unlink-addon', {
    description: 'Unlink an add-on from this application',
    args: [args.addonIdOrName],
  }, service('unlinkAddon'));
  const serviceCommands = cliparse.command('service', {
    description: 'Manage service dependencies',
    options: [opts.alias, opts.appIdOrName, opts.onlyApps, opts.onlyAddons, opts.showAll],
    commands: [serviceLinkAppCommand, serviceUnlinkAppCommand, serviceLinkAddonCommand, serviceUnlinkAddonCommand],
  }, service('list'));

  // SSH COMMAND
  const ssh = lazyRequirePromiseModule('../src/commands/ssh.js');
  const sshCommand = cliparse.command('ssh', {
    description: 'Connect to running instances through SSH',
    options: [opts.alias, opts.appIdOrName, opts.sshIdentityFile],
  }, ssh('ssh'));

  // STATUS COMMAND
  const status = lazyRequirePromiseModule('../src/commands/status.js');
  const statusCommand = cliparse.command('status', {
    description: 'See the status of an application',
    options: [opts.alias],
  }, status('status'));

  // STOP COMMAND
  const stop = lazyRequirePromiseModule('../src/commands/stop.js');
  const stopCommand = cliparse.command('stop', {
    description: 'Stop a running application',
    options: [opts.alias],
  }, stop('stop'));

  // TCP-REDIRS COMMAND
  const tcpRedirs = lazyRequirePromiseModule('../src/commands/tcp-redirs.js');
  const tcpRedirsListNamespacesCommand = cliparse.command('list-namespaces', {
    description: 'List the namespaces in which you can create new TCP redirections',
  }, tcpRedirs('listNamespaces'));
  const tcpRedirsAddCommand = cliparse.command('add', {
    description: 'Add a new TCP redirection to the application',
    options: [opts.namespace, opts.confirmTcpRedirCreation],
  }, tcpRedirs('add'));
  const tcpRedirsRemoveCommand = cliparse.command('remove', {
    description: 'Remove a TCP redirection from the application',
    options: [opts.namespace],
    args: [args.port],
  }, tcpRedirs('remove'));
  const tcpRedirsCommands = cliparse.command('tcp-redirs', {
    description: 'Control the TCP redirections from reverse proxies to your application',
    options: [opts.alias],
    commands: [tcpRedirsListNamespacesCommand, tcpRedirsAddCommand, tcpRedirsRemoveCommand],
  }, tcpRedirs('list'));

  // UNLINK COMMAND
  const unlink = lazyRequirePromiseModule('../src/commands/unlink.js');
  const appUnlinkCommand = cliparse.command('unlink', {
    description: 'Unlink this repo from an existing application',
    args: [args.alias],
  }, unlink('unlink'));

  // VERSION COMMAND
  const version = lazyRequirePromiseModule('../src/commands/version.js');
  const versionCommand = cliparse.command('version', {
    description: 'Display the clever-tools version',
    args: [],
  }, version('version'));

  // WEBHOOKS COMMAND
  const webhooks = lazyRequirePromiseModule('../src/commands/webhooks.js');
  const addWebhookCommand = cliparse.command('add', {
    description: 'Register webhook to be called when events happen',
    options: [opts.webhookFormat, opts.notificationEventType, opts.notificationScope],
    args: [args.notificationName, args.webhookUrl],
  }, webhooks('add'));
  const removeWebhookCommand = cliparse.command('remove', {
    description: 'Remove an existing webhook',
    args: [args.notificationId],
  }, webhooks('remove'));
  const webhooksCommand = cliparse.command('webhooks', {
    description: 'Manage webhooks',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    commands: [addWebhookCommand, removeWebhookCommand],
  }, webhooks('list'));

  // DATABASES COMMANDS
  const database = lazyRequirePromiseModule('../src/commands/database.js');
  const downloadBackupCommand = cliparse.command('download', {
    description: 'Download a database backup',
    args: [args.databaseId, args.backupId],
    options: [opts.output],
  }, database('downloadBackups'));
  const backupsCommand = cliparse.command('backups', {
    description: 'List available database backups',
    args: [args.databaseId],
    options: [opts.orgaIdOrName, opts.humanJsonOutputFormat],
    commands: [
      downloadBackupCommand,
    ],
  }, database('listBackups'));
  const databaseCommand = cliparse.command('database', {
    description: 'List available databases',
    commands: [backupsCommand],
  }, () => {
    console.info('This command is not available, you can try the following commands:');
    console.info('clever database backups');
    console.info('clever database backups download');
  });

  // Patch help command description
  cliparseCommands.helpCommand.description = 'Display help about the Clever Cloud CLI';

  const commands = _sortBy([
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
    cliparseCommands.helpCommand,
    loginCommand,
    logoutCommand,
    logsCommand,
    makeDefaultCommand,
    // Not ready for stable release yet
    // networkGroupsCommand,
    // ngCommand,
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
  ], 'name');

  // CLI PARSER
  const cliParser = cliparse.cli({
    name: 'clever',
    description: 'CLI tool to manage Clever Cloud\'s data and products',
    version: pkg.version,
    options: [opts.color, opts.verbose, opts.updateNotifier],
    helpCommand: false,
    commands,
  });

  // Make sure argv[0] is always "node"
  const cliArgs = process.argv;
  cliArgs[0] = 'node';
  cliparse.parse(cliParser, cliArgs);
}

// Right now, this is the only way to do this properly
// cliparse doesn't allow unknown options/arguments
if (process.argv[2] === 'curl') {
  require('../src/commands/curl.js').curl();
}
else {
  run();
}
