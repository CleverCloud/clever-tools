'use strict';

var cliparse = require('cliparse');
var cliparseCommands = require('cliparse/src/command.js');
var updateNotifier = require('update-notifier');
var _sortBy = require('lodash/sortBy.js');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var git = require('isomorphic-git');
var http = require('isomorphic-git/http/node/index.cjs');
var slugify = require('slugify');
var commonEnv = require('common-env');
var mkdirp = require('mkdirp');
var xdg = require('xdg');
var colors = require('colors/safe.js');
var clfDate = require('clf-date');
var application$1 = require('@clevercloud/client/cjs/api/v2/application.js');
var product = require('@clevercloud/client/cjs/api/v2/product.js');
var organisation = require('@clevercloud/client/cjs/api/v2/organisation.js');
var oauth_node_js = require('@clevercloud/client/cjs/oauth.node.js');
var requestWarp10_superagent_js = require('@clevercloud/client/cjs/request-warp10.superagent.js');
var prefixUrl_js = require('@clevercloud/client/cjs/prefix-url.js');
var request_superagent_js = require('@clevercloud/client/cjs/request.superagent.js');
var readline = require('readline');
var user_js = require('@clevercloud/client/cjs/api/v2/user.js');
var semver = require('semver');
var addon_js = require('@clevercloud/client/cjs/api/v2/addon.js');
var addonProviders_js = require('@clevercloud/client/cjs/api/v4/addon-providers.js');
require('@clevercloud/client/cjs/api/v4/network-group.js');
var accessLogs_js = require('@clevercloud/client/cjs/access-logs.js');
var warp10_js = require('@clevercloud/client/cjs/api/v2/warp-10.js');
var date_js = require('@clevercloud/client/cjs/utils/date.js');
var moment = require('moment');
var table = require('text-table');
var stringLength = require('string-length');
var events_node_js = require('@clevercloud/client/cjs/streams/events.node.js');
var envVars_js = require('@clevercloud/client/cjs/utils/env-vars.js');
var log_js = require('@clevercloud/client/cjs/api/v2/log.js');
var logs_node_js = require('@clevercloud/client/cjs/streams/logs.node.js');
var util = require('util');
var os = require('os');
var linuxReleaseInfo = require('linux-release-info');
var _countBy = require('lodash/countBy.js');
var crypto = require('crypto');
var openPage = require('open');
var superagent = require('superagent');
var notification_js = require('@clevercloud/client/cjs/api/v2/notification.js');
var child_process = require('child_process');
var backups_js = require('@clevercloud/client/cjs/api/v2/backups.js');
var util_js = require('curlconverter/util.js');

function findPath (dir, name) {
  const fullPath = path.join(dir, name);
  return fs.promises.stat(fullPath)
    .then(() => dir)
    .catch((e) => {
      if (e.code === 'ENOENT' && dir !== '/') {
        const parent = path.join(dir, '..');
        return findPath(parent, name);
      }
      throw e;
    });
}

function getPrefix (severity) {
  const prefix = `[${severity.toUpperCase()}] `;
  const prefixLength = prefix.length;
  if (severity === 'error') {
    return { prefix: colors.bold.red(prefix), prefixLength };
  }
  return { prefix, prefixLength };
}

function processApiError (error) {
  if (error.id == null || error.message == null) {
    return error;
  }
  const fields = _.map(error.fields, (msg, field) => `${field}: ${msg}`);
  return [`${error.message} [${error.id}]`, ...fields].join('\n');
}
function formatLines (prefixLength, lines) {
  const blankPrefix = _.repeat(' ', prefixLength);
  return (lines || '')
    .split('\n')
    .map((line, i) => (i === 0) ? line : `${blankPrefix}${line}`)
    .join('\n');
}

const Logger = _(['debug', 'info', 'warn', 'error'])
  .map((severity) => {
    if (process.env.CLEVER_QUIET || (!process.env.CLEVER_VERBOSE && (severity === 'debug' || severity === 'info'))) {
      return [severity, _.noop];
    }
    const consoleFn = (severity === 'error') ? console.error : console.log;
    const { prefix, prefixLength } = getPrefix(severity);
    return [severity, (err) => {
      const message = _.get(err, 'message', err);
      const formattedMsg = formatLines(prefixLength, processApiError(message));
      if (process.env.CLEVER_VERBOSE && severity === 'error') {
        console.error('[STACKTRACE]');
        console.error(err);
        console.error('[/STACKTRACE]');
      }
      return consoleFn(`${prefix}${formattedMsg}`);
    }];
  })
  .fromPairs()
  .value();

// No decoration for Logger.println
Logger.println = console.log;

// No decoration for Logger.printErrorLine
Logger.printErrorLine = console.error;

// Only exported for testing, shouldn't be used directly
Logger.processApiError = processApiError;

const env$1 = commonEnv(Logger);

const CONFIG_FILES = {
  MAIN: 'clever-tools.json',
  IDS_CACHE: 'ids-cache.json',
};

function getConfigPath (configFile) {
  const configDir = (process.platform === 'win32')
    ? path.resolve(process.env.APPDATA, 'clever-cloud')
    : xdg.basedir.configPath('clever-cloud');
  return path.resolve(configDir, configFile);
}

async function loadOAuthConf () {
  Logger.debug('Load configuration from environment variables');
  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    return {
      source: 'environment variables',
      token: process.env.CLEVER_TOKEN,
      secret: process.env.CLEVER_SECRET,
    };
  }
  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  try {
    const rawFile = await fs.promises.readFile(conf.CONFIGURATION_FILE);
    const { token, secret } = JSON.parse(rawFile);
    return {
      source: 'configuration file',
      token,
      secret,
    };
  }
  catch (error) {
    Logger.info(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`);
    return {
      source: 'none',
    };
  }
}

async function writeOAuthConf (oauthData) {
  Logger.debug('Write the tokens in the configuration file…');
  const configDir = path.dirname(conf.CONFIGURATION_FILE);
  try {
    await mkdirp(configDir, { mode: 0o700 });
    await fs.promises.writeFile(conf.CONFIGURATION_FILE, JSON.stringify(oauthData));
  }
  catch (error) {
    throw new Error(`Cannot write configuration to ${conf.CONFIGURATION_FILE}\n${error.message}`);
  }
}

async function loadIdsCache () {
  const cachePath = getConfigPath(CONFIG_FILES.IDS_CACHE);
  try {
    const rawFile = await fs.promises.readFile(cachePath);
    return JSON.parse(rawFile);
  }
  catch (error) {
    Logger.info(`Cannot load IDs cache from ${cachePath}\n${error.message}`);
    return {
      owners: {},
      addons: {},
    };
  }
}

async function writeIdsCache (ids) {
  const cachePath = getConfigPath(CONFIG_FILES.IDS_CACHE);
  const idsJson = JSON.stringify(ids);
  try {
    await fs.promises.writeFile(cachePath, idsJson);
  }
  catch (error) {
    throw new Error(`Cannot write IDs cache to ${cachePath}\n${error.message}`);
  }
}

const conf = env$1.getOrElseAll({
  API_HOST: 'https://api.clever-cloud.com',
  // API_HOST: 'https://ccapi-preprod.cleverapps.io',
  LOG_WS_URL: 'wss://api.clever-cloud.com/v2/logs/logs-socket/<%- appId %>?since=<%- timestamp %>',
  LOG_HTTP_URL: 'https://api.clever-cloud.com/v2/logs/<%- appId %>',
  EVENT_URL: 'wss://api.clever-cloud.com/v2/events/event-socket',
  WARP_10_EXEC_URL: 'https://c1-warp10-clevercloud-customers.services.clever-cloud.com/api/v0/exec',
  // the disclosure of these tokens is not considered as a vulnerability. Do not report this to our security service.
  OAUTH_CONSUMER_KEY: 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e',
  OAUTH_CONSUMER_SECRET: 'MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT',
  SSH_GATEWAY: 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com',

  CONFIGURATION_FILE: getConfigPath(CONFIG_FILES.MAIN),
  CONSOLE_TOKEN_URL: 'https://console.clever-cloud.com/cli-oauth',
  // CONSOLE_TOKEN_URL: 'https://next-console.cleverapps.io/cli-oauth',

  CLEVER_CONFIGURATION_DIR: path.resolve('.', 'clevercloud'),
  APP_CONFIGURATION_FILE: path.resolve('.', '.clever.json'),
});

async function getRepo () {
  try {
    const dir = await findPath('.', '.git');
    return { fs, dir, http };
  }
  catch (e) {
    throw new Error('Could not find the .git folder.');
  }
}

async function onAuth () {
  const tokens = await loadOAuthConf();
  return {
    username: tokens.token,
    password: tokens.secret,
  };
}

async function addRemote (remoteName, url) {
  const repo = await getRepo();
  const safeRemoteName = slugify(remoteName);
  const allRemotes = await git.listRemotes({ ...repo });
  const existingRemote = _.find(allRemotes, { remote: safeRemoteName });
  if (existingRemote == null) {
    // In some situations, we may end up with race conditions so we force it
    return git.addRemote({ ...repo, remote: safeRemoteName, url, force: true });
  }
}

async function resolveFullCommitId (commitId) {
  if (commitId == null) {
    return null;
  }
  try {
    const repo = await getRepo();
    return await git.expandOid({ ...repo, oid: commitId });
  }
  catch (e) {
    if (e.code === 'ShortOidNotFound') {
      throw new Error(`Commit id ${commitId} is ambiguous`);
    }
    throw e;
  }
}

async function getRemoteCommit (remoteUrl) {
  const repo = await getRepo();
  const remoteInfos = await git.getRemoteInfo({
    ...repo,
    onAuth,
    url: remoteUrl,
  });
  return _.get(remoteInfos, 'refs.heads.master');
}

async function getFullBranch (branchName) {
  const repo = await getRepo();
  if (branchName === '') {
    const currentBranch = await git.currentBranch({ ...repo, fullname: true });
    return currentBranch || 'HEAD';
  }
  return git.expandRef({ ...repo, ref: branchName });
}
async function getBranchCommit (refspec) {
  const repo = await getRepo();
  return git.resolveRef({ ...repo, ref: refspec });
}

async function push (remoteUrl, branchRefspec, force) {
  const repo = await getRepo();
  try {
    const push = await git.push({
      ...repo,
      onAuth,
      url: remoteUrl,
      ref: branchRefspec,
      remoteRef: 'master',
      force,
    });
    if (push.errors != null) {
      throw new Error(push.errors.join(', '));
    }
    return push;
  }
  catch (e) {
    if (e.code === 'PushRejectedNonFastForward') {
      throw new Error('Push rejected because it was not a simple fast-forward. Use "--force" to override.');
    }
    throw e;
  }
}

function completeBranches () {
  return getRepo()
    .then((repo) => git.listBranches(repo))
    .then(cliparse.autocomplete.words);
}

async function isShallow () {
  const { dir } = await getRepo();
  try {
    await fs.promises.access(path.join(dir, '.git', 'shallow'));
    return true;
  }
  catch (e) {
    return false;
  }
}

function getFormatter (format, isAddon) {
  switch (format.toLowerCase()) {
    // "simple" is the legacy default, "human" is the new one
    case 'human':
    case 'simple':
      return isAddon ? formatSimpleAddon : formatSimple;
    case 'extended':
      return isAddon ? formatExtendedAddon : formatExtended;
    case 'clf':
      return isAddon ? formatCLFAddon : formatCLF;
    case 'json':
      return (l) => JSON.stringify(l);
  }
}

function formatSource (l) {
  if (l.s != null) {
    const location = l.s.ct ? `${l.s.ct}, ${l.s.co}` : l.s.co;
    return `${l.ipS} - ${location}`;
  }
  else {
    return l.ipS;
  }
}

function formatSimple (l) {
  return `${new Date(l.t).toISOString()} ${l.ipS} ${l.vb} ${l.path}`;
}

function formatExtended (l) {
  return `${new Date(l.t).toISOString()} [ ${formatSource(l)} ] ${l.vb} ${l.h} ${l.path} ${l.sC}`;
}

function formatCLF (l) {
  return `${l.ipS} - - [${clfDate(new Date(l.t))}] "${l.vb} ${l.path} -" ${l.sC} ${l.bOut}`;
}

function formatSimpleAddon (l) {
  return `${new Date(l.t).toISOString()} ${l.ipS}`;
}

function formatExtendedAddon (l) {
  return `${new Date(l.t).toISOString()} [ ${formatSource(l)} ] duration(ms): ${l.sDuration}`;
}

function formatCLFAddon (l) {
  return `${l.ipS} - - [${clfDate(new Date(l.t))}] "- - -" - ${l.bOut}`;
}

async function loadTokens$1 () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

async function sendToApi (requestParams) {
  const tokens = await loadTokens$1();
  return Promise.resolve(requestParams)
    .then(prefixUrl_js.prefixUrl(conf.API_HOST))
    .then(oauth_node_js.addOauthHeader(tokens))
    .then((requestParams) => {
      if (process.env.CLEVER_VERBOSE) {
        Logger.debug(`${requestParams.method.toUpperCase()} ${requestParams.url} ? ${JSON.stringify(requestParams.queryParams)}`);
      }
      return requestParams;
    })
    .then((requestParams) => request_superagent_js.request(requestParams, { retry: 1 }));
}

function sendToWarp10 (requestParams) {
  return Promise.resolve(requestParams)
    .then(prefixUrl_js.prefixUrl(conf.WARP_10_EXEC_URL))
    .then((requestParams) => requestWarp10_superagent_js.execWarpscript(requestParams, { retry: 1 }));
}

async function getHostAndTokens () {
  const tokens = await loadTokens$1();
  return {
    apiHost: conf.API_HOST,
    tokens,
  };
}

function getCurrent () {
  return organisation.get({}).then(sendToApi);
}
function getCurrentId () {
  return organisation.get({}).then(sendToApi)
    .then(({ id }) => id);
}

// TODO: Maybe use fs-utils findPath()
async function loadApplicationConf (ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(conf.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(conf.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);
  Logger.debug('Loading app configuration from ' + fullPath);
  try {
    const contents = await fs.promises.readFile(fullPath);
    return JSON.parse(contents);
  }
  catch (error) {
    Logger.info('Cannot load app configuration from ' + conf.APP_CONFIGURATION_FILE + ' (' + error + ')');
    if (ignoreParentConfig || path.parse(pathToFolder).root === pathToFolder) {
      return { apps: [] };
    }
    return loadApplicationConf(ignoreParentConfig, path.normalize(path.join(pathToFolder, '..')));
  }
}
async function addLinkedApplication (appData, alias, ignoreParentConfig) {
  const currentConfig = await loadApplicationConf(ignoreParentConfig);

  const appEntry = {
    app_id: appData.id,
    org_id: appData.ownerId,
    deploy_url: appData.deployment.httpUrl || appData.deployment.url,
    name: appData.name,
    alias: alias || slugify(appData.name),
  };

  const isPresent = currentConfig.apps.find((app) => app.app_id === appEntry.app_id) != null;

  // ToDo see what to do when there is a conflict between an existing entry
  // and the entry we want to add (same app_id, different other values)
  if (!isPresent) {
    currentConfig.apps.push(appEntry);
  }

  return persistConfig(currentConfig);
}
async function removeLinkedApplication (alias) {
  const currentConfig = await loadApplicationConf();
  const newConfig = {
    ...currentConfig,
    apps: currentConfig.apps.filter((appEntry) => appEntry.alias !== alias),
  };
  return persistConfig(newConfig);
}
function findApp (config, alias) {

  if (_.isEmpty(config.apps)) {
    throw new Error('There are no applications linked. You can add one with `clever link`');
  }

  if (alias != null) {
    const [appByAlias, secondAppByAlias] = _.filter(config.apps, { alias });
    if (appByAlias == null) {
      throw new Error(`There are no applications matching alias ${alias}`);
    }
    if (secondAppByAlias != null) {
      throw new Error(`There are several applications matching alias ${alias}. This should not happen, your \`.clever.json\` should be fixed.`);
    }
    return appByAlias;
  }

  return findDefaultApp(config);
}

function findDefaultApp (config) {
  if (_.isEmpty(config.apps)) {
    throw new Error('There are no applications linked. You can add one with `clever link`');
  }

  if (config.default != null) {
    const defaultApp = _.find(config.apps, { app_id: config.default });
    if (defaultApp == null) {
      throw new Error('The default application is not listed anymore. This should not happen, your `.clever.json` should be fixed.');
    }
    return defaultApp;
  }

  if (config.apps.length === 1) {
    return config.apps[0];
  }

  const aliases = _.map(config.apps, 'alias').join(', ');
  throw new Error(`Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: ${aliases}`);
}

async function getAppDetails ({ alias }) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const ownerId = (app.org_id != null)
    ? app.org_id
    : await getCurrentId();
  return {
    appId: app.app_id,
    ownerId: ownerId,
    deployUrl: app.deploy_url,
    name: app.name,
    alias: app.alias,
  };
}
function persistConfig (modifiedConfig) {
  const jsonContents = JSON.stringify(modifiedConfig, null, 2);
  return fs.promises.writeFile(conf.APP_CONFIGURATION_FILE, jsonContents);
}
async function setDefault (alias) {
  const config = await loadApplicationConf();
  const app = findApp(config, alias);
  const newConfig = { ...config, default: app.app_id };
  return persistConfig(newConfig);
}

function ask (question) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function confirm (question, rejectionMessage, expectedAnswers = ['yes', 'y']) {
  const answer = await ask(question);
  if (!expectedAnswers.includes(answer)) {
    throw new Error(rejectionMessage);
  }
  return true;
}

async function getId$2 (orgaIdOrName) {
  if (orgaIdOrName == null) {
    return null;
  }

  if (orgaIdOrName.orga_id != null) {
    return orgaIdOrName.orga_id;
  }

  return getByName$2(orgaIdOrName.orga_name)
    .then((orga) => orga.id);
}

async function getByName$2 (name) {

  const fullSummary = await user_js.getSummary({}).then(sendToApi);
  const filteredOrgs = _.filter(fullSummary.organisations, { name });

  if (filteredOrgs.length === 0) {
    throw new Error('Organisation not found');
  }
  if (filteredOrgs.length > 1) {
    throw new Error('Ambiguous organisation name');
  }

  return filteredOrgs[0];
}

async function getNamespaces (params) {
  const { alias } = params.options;
  const { ownerId } = await getAppDetails({ alias });

  return organisation.getNamespaces({ id: ownerId }).then(sendToApi);
}

function completeNamespaces () {
  // Sadly we do not have access to current params in complete as of now
  const params = { options: {} };

  return getNamespaces(params).then(cliparse.autocomplete.words);
}

function listAvailableTypes () {
  return cliparse.autocomplete.words(['docker', 'elixir', 'go', 'gradle', 'haskell', 'jar', 'maven', 'node', 'php', 'play1', 'play2', 'python', 'ruby', 'rust', 'sbt', 'static-apache', 'war']);
}
function listAvailableZones () {
  return cliparse.autocomplete.words(['par', 'mtl']);
}
function listAvailableAliases () {
  return loadApplicationConf().then(({ apps }) => cliparse.autocomplete.words(_.map(apps, 'alias')));
}
function listAvailableFlavors () {
  return ['pico', 'nano', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
}
async function getId$1 (ownerId, dependency) {
  if (dependency.app_id) {
    return dependency.app_id;
  }
  const app = await getByName$1(ownerId, dependency.app_name);
  return app.id;
}
async function getInstanceType (type) {

  // TODO: We should be able to use it without {}
  const types = await product.getAvailableInstances({}).then(sendToApi);

  const enabledTypes = types.filter((t) => t.enabled);
  const matchingVariants = enabledTypes.filter((t) => t.variant != null && t.variant.slug === type);
  const instanceVariant = _.sortBy(matchingVariants, 'version').reverse()[0];
  if (instanceVariant == null) {
    throw new Error(type + ' type does not exist.');
  }
  return instanceVariant;
}
async function create$4 (name, typeName, region, orgaIdOrName, github) {
  Logger.debug('Create the application…');

  const ownerId = (orgaIdOrName != null)
    ? await getId$2(orgaIdOrName)
    : await getCurrentId();

  const instanceType = await getInstanceType(typeName);

  const newApp = {
    deploy: 'git',
    description: name,
    instanceType: instanceType.type,
    instanceVersion: instanceType.version,
    instanceVariant: instanceType.variant.id,
    maxFlavor: instanceType.defaultFlavor.name,
    maxInstances: 1,
    minFlavor: instanceType.defaultFlavor.name,
    minInstances: 1,
    name: name,
    zone: region,
  };

  if (github != null) {
    newApp.oauthService = 'github';
    newApp.oauthApp = github;
  }

  return application.create({ id: ownerId }, newApp).then(sendToApi);
}
async function deleteApp$1 (addDetails, skipConfirmation) {
  Logger.debug('Deleting app: ' + addDetails.name + ' (' + addDetails.appId + ')');

  if (!skipConfirmation) {
    await confirm(
      `Deleting the application ${addDetails.name} can't be undone, please type '${addDetails.name}' to confirm: `,
      'No confirmation, aborting application deletion',
      [addDetails.name],
    );
  }

  return application.remove({ id: addDetails.ownerId, appId: addDetails.appId }).then(sendToApi);
}
function getApplicationByName (apps, name) {
  const filteredApps = apps.filter((app) => app.name === name);
  if (filteredApps.length === 1) {
    return filteredApps[0];
  }
  else if (filteredApps.length === 0) {
    throw new Error('Application not found');
  }
  throw new Error('Ambiguous application name');
}
async function getByName$1 (ownerId, name) {
  const apps = await application.getAll({ id: ownerId }).then(sendToApi);
  return getApplicationByName(apps, name);
}
function get$1 (ownerId, appId) {
  Logger.debug(`Get information for the app: ${appId}`);
  return application.get({ id: ownerId, appId }).then(sendToApi);
}
function getFromSelf (appId) {
  Logger.debug(`Get information for the app: ${appId}`);
  // /self differs from /organisations only for this one:
  // it fallbacks to the organisations of which the user
  // is a member, if it doesn't belong to Personal Space.
  return application.get({ appId }).then(sendToApi);
}
async function linkRepo (app, orgaIdOrName, alias, ignoreParentConfig) {
  Logger.debug(`Linking current repository to the app: ${app.app_id || app.app_name}`);

  const ownerId = (orgaIdOrName != null)
    ? await getId$2(orgaIdOrName)
    : await getCurrentId();

  const appData = (app.app_id != null)
    ? await getFromSelf(app.app_id)
    : await getByName$1(ownerId, app.app_name);

  return addLinkedApplication(appData, alias, ignoreParentConfig);
}
function unlinkRepo (alias) {
  Logger.debug(`Unlinking current repository from the app: ${alias}`);
  return removeLinkedApplication(alias);
}
function redeploy (ownerId, appId, commit, withoutCache) {
  Logger.debug(`Redeploying the app: ${appId}`);
  const useCache = (withoutCache) ? 'no' : null;
  return application.redeploy({ id: ownerId, appId, commit, useCache }).then(sendToApi);
}
function mergeScalabilityParameters (scalabilityParameters, instance) {
  const flavors = listAvailableFlavors();

  if (scalabilityParameters.minFlavor) {
    instance.minFlavor = scalabilityParameters.minFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor)) {
      instance.maxFlavor = instance.minFlavor;
    }
  }
  if (scalabilityParameters.maxFlavor) {
    instance.maxFlavor = scalabilityParameters.maxFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor)
      && scalabilityParameters.minFlavor == null) {
      instance.minFlavor = instance.maxFlavor;
    }
  }

  if (scalabilityParameters.minInstances) {
    instance.minInstances = scalabilityParameters.minInstances;
    if (instance.minInstances > instance.maxInstances) {
      instance.maxInstances = instance.minInstances;
    }
  }
  if (scalabilityParameters.maxInstances) {
    instance.maxInstances = scalabilityParameters.maxInstances;
    if (instance.minInstances > instance.maxInstances && scalabilityParameters.minInstances == null) {
      instance.minInstances = instance.maxInstances;
    }
  }
  return instance;
}
async function setScalability (appId, ownerId, scalabilityParameters, buildFlavor) {
  Logger.info('Scaling the app: ' + appId);

  const app = await application.get({ id: ownerId, appId }).then(sendToApi);
  const instance = _.cloneDeep(app.instance);

  instance.minFlavor = instance.minFlavor.name;
  instance.maxFlavor = instance.maxFlavor.name;

  const newConfig = mergeScalabilityParameters(scalabilityParameters, instance);

  if (buildFlavor != null) {
    newConfig.separateBuild = (buildFlavor !== 'disabled');
    if (buildFlavor !== 'disabled') {
      newConfig.buildFlavor = buildFlavor;
    }
    else {
      Logger.info('No build size given, disabling dedicated build instance');
    }
  }

  return application.update({ id: ownerId, appId }, newConfig).then(sendToApi);
}
async function listDependencies (ownerId, appId, showAll) {
  const applicationDeps = await application.getAllDependencies({ id: ownerId, appId }).then(sendToApi);

  if (!showAll) {
    return applicationDeps;
  }

  const allApps = await application.getAll({ id: ownerId }).then(sendToApi);

  const applicationDepsIds = applicationDeps.map((app) => app.id);
  return allApps.map((app) => {
    const isLinked = applicationDepsIds.includes(app.id);
    return { ...app, isLinked };
  });
}

async function link$2 (ownerId, appId, dependency) {
  const dependencyId = await getId$1(ownerId, dependency);
  return application.addDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
}
async function unlink$2 (ownerId, appId, dependency) {
  const dependencyId = await getId$1(ownerId, dependency);
  return application.removeDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
}

function flavor (flavor) {
  const flavors = listAvailableFlavors();
  if (flavors.includes(flavor)) {
    return cliparse.parsers.success(flavor);
  }
  return cliparse.parsers.error('Invalid value: ' + flavor);
}

function buildFlavor (flavorOrDisabled) {
  if (flavorOrDisabled === 'disabled') {
    return cliparse.parsers.success(flavorOrDisabled);
  }
  return flavor(flavorOrDisabled);
}

function instances (instances) {
  const parsedInstances = parseInt(instances, 10);
  if (isNaN(parsedInstances)) {
    return cliparse.parsers.error('Invalid number: ' + instances);
  }
  if (parsedInstances < 1 || parsedInstances > 20) {
    return cliparse.parsers.error('The number of instances must be between 1 and 20');
  }
  return cliparse.parsers.success(parsedInstances);
}

function date (dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return cliparse.parsers.error('Invalid date: ' + dateString + ' (timestamps or IS0 8601 dates are accepted)');
  }
  return cliparse.parsers.success(date);
}

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function appIdOrName (string) {
  if (string.match(appIdRegex)) {
    return cliparse.parsers.success({ app_id: string });
  }
  return cliparse.parsers.success({ app_name: string });
}

const orgaIdRegex = /^(user_|orga_)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function orgaIdOrName (string) {
  if (string.match(orgaIdRegex)) {
    return cliparse.parsers.success({ orga_id: string });
  }
  return cliparse.parsers.success({ orga_name: string });
}

const addonIdRegex = /^addon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function addonIdOrName (string) {
  if (string.match(addonIdRegex)) {
    return cliparse.parsers.success({ addon_id: string });
  }
  return cliparse.parsers.success({ addon_name: string });
}

const ngIdRegex = /^ng_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ngIdOrLabel (string) {
  if (string.match(ngIdRegex)) {
    return cliparse.parsers.success({ ng_id: string });
  }
  return cliparse.parsers.success({ ng_label: string });
}

function commaSeparated (string) {
  return cliparse.parsers.success(string.split(','));
}

function integer (string) {
  const integer = parseInt(string);
  if (isNaN(integer)) {
    return cliparse.parsers.error('Invalid number: ' + string);
  }
  return cliparse.parsers.success(integer);
}

// /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i;
const tagRegex = /^[^,\s]+$/;

function tag (string) {
  if (string.match(tagRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid tag '${string}'. Should match ${tagRegex}`);
}

function tags (string) {
  if (String(string).length === 0) {
    return cliparse.parsers.success([]);
  }
  const tags = String(string).split(',');
  for (const current of tags) {
    if (tag(current).error) {
      return cliparse.parsers.error(`Invalid tag '${current}'. Should match \`${tagRegex}\``);
    }
  }
  return cliparse.parsers.success(tags);
}

function ngPeerRole (string) {
  const possible = ['client', 'server'];
  if (possible.includes(string)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid peer role '${string}'. Should be in ${JSON.stringify(possible)}`);
}

const ipAddressRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])$/;

function ipAddress (string) {
  if (string.match(ipAddressRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid IP address '${string}'. Should match ${ipAddressRegex}`);
}

const portNumberRegex = /^\d{1,5}$/;

function portNumber (number) {
  if (String(number).match(portNumberRegex)) {
    return cliparse.parsers.success(number);
  }
  return cliparse.parsers.error(`Invalid port number '${number}'. Should match ${portNumberRegex}`);
}

var name = "clever-tools";
var version$1 = "2.11.0";
var description = "Command Line Interface for Clever Cloud.";
var main = "bin/clever.js";
var type = "module";
var keywords = [
	"clever-tools",
	"cli",
	"clever cloud"
];
var engines = {
	node: ">=18"
};
var author = "Clever Cloud <ci@clever-cloud.com>";
var license = "Apache-2.0";
var bin = {
	clever: "bin/clever.js",
	"install-clever-completion": "scripts/install-autocomplete.sh",
	"uninstall-clever-completion": "scripts/uninstall-autocomplete.sh"
};
var files = [
	"bin",
	"src",
	"scripts/*.sh"
];
var dependencies = {
	"@babel/core": "^7.22.20",
	"@clevercloud/client": "7.9.0",
	"clf-date": "^0.2.0",
	cliparse: "^0.3.3",
	colors: "1.4.0",
	"common-env": "^6.4.0",
	curlconverter: "^3.21.0",
	"estree-walker": "^3.0.3",
	eventsource: "^1.1.0",
	globby: "^13.2.2",
	"isomorphic-git": "^1.8.2",
	"linux-release-info": "^3.0.0",
	lodash: "^4.17.21",
	"magic-string": "^0.30.3",
	mkdirp: "^1.0.4",
	moment: "^2.29.1",
	open: "^8.4.0",
	slugify: "^1.5.3",
	"string-length": "^4.0.2",
	superagent: "^6.1.0",
	"text-table": "^0.2.0",
	"update-notifier": "^5.1.0",
	uuid: "^8.3.2",
	ws: "^7.4.6",
	xdg: "^0.1.1"
};
var devDependencies = {
	"@rollup/plugin-commonjs": "^25.0.4",
	"@rollup/plugin-json": "^6.0.0",
	"@rollup/plugin-node-resolve": "^15.2.1",
	"aws-sdk": "^2.919.0",
	chai: "^4.3.4",
	del: "^6.0.0",
	eslint: "^7.27.0",
	"eslint-config-standard": "^16.0.3",
	"eslint-plugin-import": "^2.23.4",
	"eslint-plugin-node": "^11.1.0",
	"eslint-plugin-promise": "^5.1.0",
	"eslint-plugin-standard": "^5.0.0",
	"fs-extra": "^10.0.0",
	glob: "^7.1.7",
	grunt: "^1.4.1",
	"grunt-cli": "^1.4.3",
	"grunt-http": "^2.3.3",
	"grunt-mocha-test": "^0.13.3",
	mocha: "^8.4.0",
	pkg: "^5.8.1",
	rollup: "^3.29.2",
	semver: "^7.3.5"
};
var scripts = {
	build: "rollup -c rollup.config.js",
	pretest: "npm run lint",
	test: "grunt test",
	lint: "eslint bin src scripts",
	"lint:fix": "eslint --fix bin src scripts"
};
var repository = {
	type: "git",
	url: "https://github.com/CleverCloud/clever-tools.git"
};
var bugs = {
	url: "https://github.com/CleverCloud/clever-tools/issues"
};
var homepage = "https://github.com/CleverCloud/clever-tools";
var pkg = {
	scripts: [
		"src/**/*.js"
	]
};
var volta = {
	node: "20.12.2"
};
var pkg$1 = {
	name: name,
	version: version$1,
	description: description,
	main: main,
	type: type,
	keywords: keywords,
	engines: engines,
	"pkg-node-version": "18",
	author: author,
	license: license,
	bin: bin,
	files: files,
	dependencies: dependencies,
	devDependencies: devDependencies,
	scripts: scripts,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	pkg: pkg,
	volta: volta
};

function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(error);
    const semverIsOk = semver.satisfies(process.version, pkg$1.engines.node);
    if (!semverIsOk) {
      Logger.warn(`You are using node ${process.version}, some of our commands require node ${pkg$1.engines.node}. The error may be caused by this.`);
    }
    process.exit(1);
  });
}

function formatString (str, decorated = true) {
  const string = decorated ? `'${str}'` : str;
  return colors.green(string);
}

function formatUrl (url, decorated = true) {
  const string = decorated ? `<${url}>` : url;
  return colors.cyan(string);
}

function formatCommand (command, decorated = true) {
  const string = decorated ? `\`${command}\`` : command;
  return colors.magenta(string);
}

function formatCode (code, decorated = true) {
  return formatCommand(code, decorated);
}

function getOutputFormatOption (formats = []) {
  const availableFormats = ['human', 'json', ...formats];
  return cliparse.option('format', {
    aliases: ['F'],
    metavar: 'format',
    parser: (format) => {
      return availableFormats.includes(format)
        ? cliparse.parsers.success(format)
        : cliparse.parsers.error('The output format must be one of ' + availableFormats.join(', '));
    },
    default: 'human',
    description: `Output format (${availableFormats.join(', ')})`,
    complete () {
      return cliparse.autocomplete.words(availableFormats);
    },
  });
}

/*
This system uses a simplified representation of the summary to expose IDs links:

* app ID => owner ID
* add-on ID => owner ID
* real add-on ID => owner ID
* add-on ID => real add-on ID
* real add-on ID => add-on ID

{
  owners: {
    [appid]: [ownerId],
    [addonId]: [ownerId],
    [realId]: [ownerId],
  },
  addons: {
    [addonId]: { realId: [realId], addonId: [addonId] },
    [realId]: { realId: [realId], addonId: [addonId] },
  },
}
 */

async function resolveOwnerId (id) {
  return getIdFromCacheOrSummary((ids) => ids.owners[id]);
}

async function resolveAddonId (id) {

  const addonId = await getIdFromCacheOrSummary((ids) => {
    return (ids.addons[id] != null) ? ids.addons[id].addonId : null;
  });

  if (addonId != null) {
    return addonId;
  }

  throw new Error(`Add-on ${id} does not exist`);
}

async function resolveRealId (id) {

  const realId = await getIdFromCacheOrSummary((ids) => {
    return (ids.addons[id] != null) ? ids.addons[id].realId : null;
  });

  if (realId != null) {
    return realId;
  }

  throw new Error(`Add-on ${id} does not exist foo`);
}

async function getIdFromCacheOrSummary (callback) {

  const idsFromCache = await loadIdsCache();
  const idFromCache = callback(idsFromCache);
  if (idFromCache != null) {
    return idFromCache;
  }

  const idsFromSummary = await getIdsFromSummary();
  await writeIdsCache(idsFromSummary);

  const idFromSummary = callback(idsFromSummary);
  if (idFromSummary != null) {
    return idFromSummary;
  }

  return null;
}

async function getIdsFromSummary () {

  const ids = {
    owners: {},
    addons: {},
  };

  const summary = await user_js.getSummary().then(sendToApi);

  const owners = [
    summary.user,
    ...summary.organisations,
  ];

  for (const owner of owners) {
    for (const app of owner.applications) {
      ids.owners[app.id] = owner.id;
    }
    for (const addon of owner.addons) {
      ids.owners[addon.id] = owner.id;
      ids.owners[addon.realId] = owner.id;
      const addonIds = { addonId: addon.id, realId: addon.realId };
      ids.addons[addon.id] = addonIds;
      ids.addons[addon.realId] = addonIds;
    }
  }

  return ids;
}

function listProviders$1 () {
  return product.getAllAddonProviders({}).then(sendToApi);
}

async function getProvider (providerName) {
  const providers = await listProviders$1();
  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error('invalid provider name');
  }
  return provider;
}

function getProviderInfos (providerName) {
  return addonProviders_js.getAddonProvider({ providerId: providerName }).then(sendToApi)
    .catch(() => {
      // An error can occur because the add-on api doesn't implement this endpoint yet
      // This is fine, just ignore it
      Logger.debug(`${providerName} doesn't yet implement the provider info endpoint`);
      return Promise.resolve(null);
    });
}

async function list$b (ownerId, appId, showAll) {
  const allAddons = await addon_js.getAll({ id: ownerId }).then(sendToApi);

  if (appId == null) {
    // Not linked to a specific app, show everything
    return allAddons;
  }

  const myAddons = await application.getAllLinkedAddons({ id: ownerId, appId }).then(sendToApi);

  if (showAll == null) {
    return myAddons;
  }

  const myAddonIds = myAddons.map((addon) => addon.id);
  return allAddons.map((addon) => {
    const isLinked = myAddonIds.includes(addon.id);
    return { ...addon, isLinked };
  });
}

function validateAddonVersionAndOptions (region, version, addonOptions, providerInfos, planType) {
  if (providerInfos != null) {
    if (version != null) {
      const type = planType.value.toLowerCase();
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        }
        else if (cluster.version !== version) {
          throw new Error(`Invalid version ${version}, selected shared cluster only supports version ${cluster.version}`);
        }
      }
      else if (type === 'dedicated') {
        const availableVersions = Object.keys(providerInfos.dedicated);
        const hasVersion = availableVersions.find((availableVersion) => availableVersion === version);
        if (hasVersion == null) {
          throw new Error(`Invalid version ${addonOptions.version}, available versions are: ${availableVersions.join(', ')}`);
        }
      }
    }

    const chosenVersion = version != null ? version : providerInfos.defaultDedicatedVersion;

    // Check the selected options to see if the chosen plan / region offers them
    // If not, abort the creation
    if (Object.keys(addonOptions).length > 0) {
      const type = planType.value.toLowerCase();
      let availableOptions = [];
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        }

        availableOptions = cluster.features;
      }
      else if (type === 'dedicated') {
        availableOptions = providerInfos.dedicated[chosenVersion].features;
      }

      for (const selectedOption in addonOptions) {
        const isAvailable = availableOptions.find(({ name }) => name === selectedOption);
        if (isAvailable == null) {
          const optionNames = availableOptions.map(({ name }) => name).join(',');
          let availableOptionsError = null;
          if (optionNames.length > 0) {
            availableOptionsError = `Avalailble options are: ${optionNames}.`;
          }
          else {
            availableOptionsError = 'No options are available for this plan.';
          }

          throw new Error(`Option "${selectedOption}" is not available on this plan. ${availableOptionsError}`);
        }
      }
    }

    return {
      version: chosenVersion,
      ...addonOptions,
    };
  }
  else {
    if (version != null) {
      throw new Error('You provided a version for an add-on that doesn\'t support choosing the version.');
    }
    return {};
  }
}

async function create$3 ({ ownerId, name, providerName, planName, region, skipConfirmation, version, addonOptions }) {

  // TODO: We should be able to use it without {}
  const providers = await listProviders$1();

  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error('invalid provider name');
  }
  if (!provider.regions.includes(region)) {
    throw new Error(`invalid region name. Available regions: ${provider.regions.join(', ')}`);
  }

  const plan = provider.plans.find((p) => p.slug.toLowerCase() === planName.toLowerCase());
  if (plan == null) {
    const availablePlans = provider.plans.map((p) => p.slug);
    throw new Error(`invalid plan name. Available plans: ${availablePlans.join(', ')}`);
  }

  const providerInfos = await getProviderInfos(provider.id);
  const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');

  // If we have a providerInfos but we don't have a planType, we won't be able to go further
  // The process should stop here to make sure users don't create something they don't intend to
  // This missing feature should have been added during the add-on's development phase
  // The console has a similar check so I believe we shouldn't hit this
  if (providerInfos != null && planType == null) {
    throw new Error('Internal error. The selected plan misses the TYPE feature. Please contact our support with the command line you used');
  }

  const createOptions = validateAddonVersionAndOptions(region, version, addonOptions, providerInfos, planType);

  const addonToCreate = {
    name,
    plan: plan.id,
    providerId: provider.id,
    region,
    options: createOptions,
  };

  return addon_js.create({ id: ownerId }, addonToCreate).then(sendToApi);
}

async function getByName (ownerId, addonNameOrRealId) {
  const addons = await addon_js.getAll({ id: ownerId }).then(sendToApi);
  const filteredAddons = addons.filter(({ name, realId }) => {
    return name === addonNameOrRealId || realId === addonNameOrRealId;
  });
  if (filteredAddons.length === 1) {
    return filteredAddons[0];
  }
  if (filteredAddons.length === 0) {
    throw new Error('Addon not found');
  }
  throw new Error('Ambiguous addon name');
}

async function getId (ownerId, addon) {
  if (addon.addon_id) {
    return addon.addon_id;
  }
  const addonDetails = await getByName(ownerId, addon.addon_name);
  return addonDetails.id;
}

async function link$1 (ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return application.linkAddon({ id: ownerId, appId }, JSON.stringify(addonId)).then(sendToApi);
}

async function unlink$1 (ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return application.unlinkAddon({ id: ownerId, appId, addonId }).then(sendToApi);
}

async function deleteAddon$1 (ownerId, addonIdOrName, skipConfirmation) {
  const addonId = await getId(ownerId, addonIdOrName);

  if (!skipConfirmation) {
    await confirm('Deleting the addon can\'t be undone, are you sure? ', 'No confirmation, aborting addon deletion');
  }

  return addon_js.remove({ id: ownerId, addonId }).then(sendToApi);
}

async function rename$1 (ownerId, addon, name) {
  const addonId = await getId(ownerId, addon);
  return addon_js.update({ id: ownerId, addonId }, { name }).then(sendToApi);
}

function completeRegion () {
  return cliparse.autocomplete.words(['par', 'mtl']);
}

// TODO: We need to fix this
function completePlan () {
  return cliparse.autocomplete.words(['dev', 's', 'm', 'l', 'xl', 'xxl']);
}

async function findById (addonId) {
  const { user, organisations } = await user_js.getSummary({}).then(sendToApi);
  for (const orga of [user, ...organisations]) {
    for (const simpleAddon of orga.addons) {
      if (simpleAddon.id === addonId) {
        const addon = await addon_js.get({ id: orga.id, addonId }).then(sendToApi);
        return {
          ...addon,
          orgaId: orga.id,
        };
      }
    }
  }
  throw new Error(`Could not find add-on with ID: ${addonId}`);
}

async function findOwnerId (org, addonId) {

  if (org != null && org.orga_id != null) {
    return org.orga_id;
  }

  const ownerId = await resolveOwnerId(addonId);
  if (ownerId != null) {
    return ownerId;
  }

  throw new Error(`Add-on ${addonId} does not exist`);
}

function parseAddonOptions (options) {
  if (options == null) {
    return {};
  }

  return options.split(',').reduce((options, option) => {
    const [key, value] = option.split('=');
    if (value == null) {
      throw new Error("Options are malformed. Usage is '--option name=enabled|disabled|true|false'");
    }

    let formattedValue = value;
    if (value === 'true' || value === 'enabled') {
      formattedValue = 'true';
    }
    else if (value === 'false' || value === 'disabled') {
      formattedValue = 'false';
    }
    else {
      throw new Error(`Can't parse option value: ${value}. Accepted values are: enabled, disabled, true, false`);
    }

    options[key] = formattedValue;
    return options;
  }, {});
}

const CONFIG_KEYS = [
  { id: 'name', name: 'name', displayName: 'Name', kind: 'string' },
  { id: 'description', name: 'description', displayName: 'Description', kind: 'string' },
  { id: 'zero-downtime', name: 'homogeneous', displayName: 'Zero-downtime deployment', kind: 'inverted-bool' },
  { id: 'sticky-sessions', name: 'stickySessions', displayName: 'Sticky sessions', kind: 'bool' },
  { id: 'cancel-on-push', name: 'cancelOnPush', displayName: 'Cancel current deployment on push', kind: 'bool' },
  { id: 'force-https', name: 'forceHttps', displayName: 'Force redirection of HTTP to HTTPS', kind: 'force-https' },
];

function listAvailableIds () {
  return CONFIG_KEYS.map((config) => config.id);
}

function getById (id) {
  const config = CONFIG_KEYS.find((config) => config.id === id);
  if (config == null) {
    Logger.error(`Invalid configuration name: ${id}.`);
    Logger.error(`Available configuration names are: ${listAvailableIds().join(', ')}.`);
  }
  return config;
}

function display (config, value) {
  switch (config.kind) {
    case 'bool': {
      return (value) ? 'enabled' : 'disabled';
    }
    case 'inverted-bool': {
      return (value) ? 'disabled' : 'enabled';
    }
    case 'force-https': {
      return value.toLowerCase();
    }
    default: {
      return String(value);
    }
  }
}

function parse (config, value) {
  switch (config.kind) {
    case 'bool': {
      return (value !== 'false');
    }
    case 'inverted-bool': {
      return (value === 'false');
    }
    case 'force-https': {
      return (value === 'false') ? 'DISABLED' : 'ENABLED';
    }
    default: {
      return value;
    }
  }
}

function getUpdateOptions () {
  return CONFIG_KEYS
    .map((config) => getConfigOptions(config))
    .reduce((a, b) => [...a, ...b], []);
}

function getConfigOptions (config) {
  switch (config.kind) {
    case 'bool':
    case 'inverted-bool':
    case 'force-https': {
      return [
        cliparse.flag(`enable-${config.id}`, { description: `Enable ${config.id}` }),
        cliparse.flag(`disable-${config.id}`, { description: `Disable ${config.id}` }),
      ];
    }
    default: {
      return [
        cliparse.option(`${config.id}`, { description: `Set ${config.id}` }),
      ];
    }
  }
}

function parseOptions (options) {
  const newOptions = CONFIG_KEYS
    .map((config) => parseConfigOption(config, options))
    .filter((a) => a != null);
  return Object.fromEntries(newOptions);
}

function parseConfigOption (config, options) {
  switch (config.kind) {
    case 'bool': {
      const enable = options[`enable-${config.id}`];
      const disable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        return [config.name, enable];
      }
      return null;
    }
    case 'inverted-bool': {
      const disable = options[`enable-${config.id}`];
      const enable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        return [config.name, enable];
      }
      return null;
    }
    case 'force-https': {
      const enable = options[`enable-${config.id}`];
      const disable = options[`disable-${config.id}`];
      if (enable && disable) {
        Logger.warn(`${config.id} is both enabled and disabled, ignoring`);
      }
      else if (enable || disable) {
        const value = (enable) ? 'ENABLED' : 'DISABLED';
        return [config.name, value];
      }
      return null;
    }
    default: {
      if (options[config.id] !== null) {
        return [config.name, options[config.id]];
      }
      return null;
    }
  }
}

function printConfig (app, config) {
  if (app[config.name] != null) {
    Logger.println(`${config.displayName}: ${colors.bold(display(config, app[config.name]))}`);
  }
}

function printById (app, id) {
  const config = getById(id);
  if (config != null) {
    printConfig(app, config);
  }
}

function printByName (app, name) {
  const config = CONFIG_KEYS.find((config) => config.name === name);
  printConfig(app, config);
}

function print (app) {
  for (const config of CONFIG_KEYS) {
    printConfig(app, config);
  }
}

const DRAIN_TYPES = [
  { id: 'TCPSyslog' },
  { id: 'UDPSyslog' },
  { id: 'HTTP', credentials: 'OPTIONAL' },
  { id: 'ElasticSearch', credentials: 'MANDATORY' },
  { id: 'DatadogHTTP' },
  { id: 'NewRelicHTTP', apiKey: 'MANDATORY' },
];

function createDrainBody (appId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig) {

  if (!authorizeDrainCreation(drainTargetType, drainTargetCredentials, drainTargetConfig)) {
    throw new Error("Credentials are: optional for HTTP, mandatory for ElasticSearch, NewRelicHTTP and TCPSyslog/UDPSyslog don't need them.");
  }

  const body = {
    url: drainTargetURL,
    drainType: drainTargetType,
  };
  if (credentialsExist(drainTargetCredentials)) {
    body.credentials = {
      username: drainTargetCredentials.username || '',
      password: drainTargetCredentials.password || '',
    };
  }
  if (keyExist(drainTargetConfig)) {
    body.APIKey = drainTargetConfig.apiKey;
  }
  return body;
}

function authorizeDrainCreation (drainTargetType, drainTargetCredentials, drainTargetConfig) {
  if (drainTypeExists(drainTargetType)) {
    // retrieve creds for drain type ('mandatory', 'optional', undefined)
    const credStatus = credentialsStatus(drainTargetType).credentials;
    const keyStatus = credentialsStatus(drainTargetType).apiKey;

    if (credStatus === 'MANDATORY') {
      return credentialsExist(drainTargetCredentials);
    }
    if (credStatus === 'OPTIONAL') {
      return true;
    }
    if (!credStatus && !keyStatus) {
      return credentialsEmpty(drainTargetCredentials);
    }

    if (keyStatus === 'MANDATORY') {
      return keyExist(drainTargetConfig);
    }
    if (keyStatus === 'OPTIONAL') {
      return true;
    }
    if (!keyStatus) {
      return keyEmpty(drainTargetConfig);
    }
  }
}

function credentialsStatus (drainTargetType) {
  return DRAIN_TYPES.find(({ id }) => id === drainTargetType);
}

function drainTypeExists (drainTargetType) {
  return DRAIN_TYPES.some(({ id }) => id === drainTargetType);
}

function credentialsExist ({ username, password }) {
  return username != null && password != null;
}

function credentialsEmpty ({ username, password }) {
  return username == null && password == null;
}

function keyExist ({ apiKey }) {
  return apiKey != null;
}

function keyEmpty ({ apiKey }) {
  return apiKey == null;
}

function listDrainTypes () {
  return cliparse.autocomplete.words(DRAIN_TYPES.map((type) => type.id));
}

function listMetaEvents () {
  return cliparse.autocomplete.words([
    'META_SERVICE_LIFECYCLE',
    'META_DEPLOYMENT_RESULT',
    'META_SERVICE_MANAGEMENT',
    'META_CREDITS',
  ]);
}

function getOrgaIdOrUserId (orgIdOrName) {
  return (orgIdOrName == null)
    ? getCurrentId()
    : getId$2(orgIdOrName);
}

async function getOwnerAndApp (alias, org, useLinkedApp) {

  if (!useLinkedApp) {
    const ownerId = await getOrgaIdOrUserId(org);
    return { ownerId };
  }

  return getAppDetails({ alias });
}

function listAvailablePeerRoles () {
  return cliparse.autocomplete.words(['client', 'server']);
}

const CONTINUOUS_DELAY = date_js.ONE_SECOND_MICROS * 5;

async function accessLogs (params) {
  const { alias, format, before, after, addon: addonId, follow } = params.options;

  const { ownerId, appId, realAddonId } = await getIds(addonId, alias);
  const to = (before != null) ? date_js.toMicroTimestamp(before.toISOString()) : date_js.toMicroTimestamp();
  const from = (after != null) ? date_js.toMicroTimestamp(after.toISOString()) : to - date_js.ONE_HOUR_MICROS;
  const warpToken = await warp10_js.getWarp10AccessLogsToken({ orgaId: ownerId }).then(sendToApi);

  if (follow && (before != null || after != null)) {
    Logger.warn('Access logs are displayed continuously with -f/--follow therefore --before and --after are ignored.');
  }

  const emitter = follow
    ? accessLogs_js.getContinuousAccessLogsFromWarp10({ appId, realAddonId, warpToken, delay: CONTINUOUS_DELAY }, sendToWarp10)
    : accessLogs_js.getAccessLogsFromWarp10InBatches({ appId, realAddonId, from, to, warpToken }, sendToWarp10);

  const formatLogLine = getFormatter(format, addonId != null);

  emitter.on('data', (data) => {
    data.forEach((l) => Logger.println(formatLogLine(l)));
  });

  return new Promise((resolve, reject) => {
    emitter.on('error', reject);
  });
}

async function getIds (addonId, alias) {
  if (addonId != null) {
    const addon = await findById(addonId);
    return {
      ownerId: addon.orgaId,
      realAddonId: addon.realId,
    };
  }
  return getAppDetails({ alias });
}

function list$a (ownerId, appId, showAll) {
  const limit = showAll ? null : 10;
  return application.getAllDeployments({ id: ownerId, appId, limit }).then(sendToApi);
}

function formatTable$2 (columnWidth = []) {

  const fixedWidthPlaceholder = columnWidth.map((item) => {
    if (typeof item === 'number') {
      return _.repeat(' ', item);
    }
    return item;
  });

  return function (data) {
    return table([fixedWidthPlaceholder, ...data], { stringLength })
      .split('\n')
      .slice(1)
      .join('\n');
  };
}

// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
class Deferred {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

function getColoredState (state, isLast) {
  if (state === 'OK') {
    return colors.bold.green(state);
  }
  if (state === 'FAIL' || state === 'CANCELLED') {
    return colors.bold.red(state);
  }
  if (state === 'WIP' && !isLast) {
    return colors.bold.red('FAIL');
  }
  if (state === 'WIP' && isLast) {
    return colors.bold.blue('IN PROGRESS');
  }
  Logger.warn(`Unknown deployment state: ${state}`);
  return 'UNKNOWN';
}

// We use examples of maximum width text to have a clean display
const formatActivityTable = formatTable$2([
  moment().format(),
  'IN PROGRESS',
  'downscale',
  // a git commit id is 40 chars long
  40,
  0,
]);

function formatActivityLine (event) {
  return formatActivityTable([
    [
      moment(event.date).format(),
      getColoredState(event.state, event.isLast),
      event.action,
      event.commit || 'not specified',
      event.cause,
    ],
  ]);
}
function isTemporaryEvent (ev) {
  if (ev == null) {
    return false;
  }
  return (ev.state === 'WIP' && ev.isLast) || ev.state === 'CANCELLED';
}

function clearPreviousLine () {
  if (process.stdout.isTTY) {
    process.stdout.moveCursor(0, -1);
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }
}

function handleEvent (previousEvent, event) {
  if (isTemporaryEvent(previousEvent)) {
    clearPreviousLine();
  }

  const activityLine = formatActivityLine(event);
  Logger.println(activityLine);

  return event;
}

function onEvent (previousEvent, newEvent) {
  const { event, date, data: { state, action, commit, cause } } = newEvent;
  if (event !== 'DEPLOYMENT_ACTION_BEGIN' && event !== 'DEPLOYMENT_ACTION_END') {
    return previousEvent;
  }
  return handleEvent(previousEvent, { date, state, action, commit, cause, isLast: true });
}

async function activity (params) {
  const { alias, 'show-all': showAll, follow } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const events = await list$a(ownerId, appId, showAll);
  const reversedArrayWithIndex = events
    .reverse()
    .map((event, index, all) => {
      const isLast = index === all.length - 1;
      return ({ ...event, isLast });
    });
  let lastEvent = reversedArrayWithIndex.reduce(handleEvent, {});

  if (!follow) {
    return lastEvent;
  }

  const { apiHost, tokens } = await getHostAndTokens();
  const eventsStream = new events_node_js.EventsStream({ apiHost, tokens, appId });

  const deferred = new Deferred();

  eventsStream
    .on('open', () => Logger.debug('WS for events (open) ' + JSON.stringify({ appId })))
    .on('event', (event) => {
      lastEvent = onEvent(lastEvent, event);
      return lastEvent;
    })
    .on('ping', () => Logger.debug('WS for events (ping)'))
    .on('close', ({ reason }) => Logger.debug('WS for events (close) ' + reason))
    .on('error', deferred.reject);

  eventsStream.open({ autoRetry: true, maxRetryCount: 6 });

  return deferred.promise;
}

const formatTable$1 = formatTable$2();

async function list$9 (params) {
  const { org: orgaIdOrName } = params.options;

  const ownerId = await getId$2(orgaIdOrName);
  const addons = await list$b(ownerId);

  const formattedAddons = addons.map((addon) => {
    return [
      addon.plan.name + ' ' + addon.provider.name,
      addon.region,
      colors.bold.green(addon.name),
      addon.id,
    ];
  });
  Logger.println(formatTable$1(formattedAddons));
}

async function create$2 (params) {
  const [providerName, name] = params.args;
  const { link: linkedAppAlias, plan: planName, region, yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const version = params.options['addon-version'];
  const addonOptions = parseAddonOptions(params.options.option);

  const ownerId = (orgaIdOrName != null)
    ? await getId$2(orgaIdOrName)
    : await getCurrentId();

  if (linkedAppAlias != null) {
    const linkedAppData = await getAppDetails({ alias: linkedAppAlias });
    if (orgaIdOrName != null && linkedAppData.ownerId !== ownerId) {
      Logger.warn('The specified application does not belong to the specified organisation. Ignoring the `--org` option');
    }
    const newAddon = await create$3({
      ownerId: linkedAppData.ownerId,
      name,
      providerName,
      planName,
      region,
      skipConfirmation,
      version,
      addonOptions,
    });
    await link$1(linkedAppData.ownerId, linkedAppData.appId, { addon_id: newAddon.id });
    Logger.println(`Addon ${name} (id: ${newAddon.id}) successfully created and linked to the application`);
  }
  else {
    const newAddon = await create$3({
      ownerId,
      name,
      providerName,
      planName,
      region,
      skipConfirmation,
      version,
      addonOptions,
    });
    Logger.println(`Addon ${name} (id: ${newAddon.id}) successfully created`);
  }
}

async function deleteAddon (params) {
  const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const [addon] = params.args;

  const ownerId = await getId$2(orgaIdOrName);
  await deleteAddon$1(ownerId, addon, skipConfirmation);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully deleted`);
}

async function rename (params) {
  const [addon, newName] = params.args;
  const { org: orgaIdOrName } = params.options;

  const ownerId = await getId$2(orgaIdOrName);
  await rename$1(ownerId, addon, newName);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
}

async function listProviders () {

  const providers = await listProviders$1();

  const formattedProviders = providers.map((provider) => {
    return [
      colors.bold(provider.id),
      provider.name,
      provider.shortDesc || '',
    ];
  });
  Logger.println(formatTable$1(formattedProviders));
}

async function showProvider (params) {
  const [providerName] = params.args;

  const provider = await getProvider(providerName);
  const providerInfos = await getProviderInfos(providerName);
  const providerPlans = provider.plans.sort((a, b) => a.price - b.price);

  Logger.println(colors.bold(provider.id));
  Logger.println(`${provider.name}: ${provider.shortDesc}`);
  Logger.println();
  Logger.println(`Available regions: ${provider.regions.join(', ')}`);
  Logger.println();
  Logger.println('Available plans');

  providerPlans.forEach((plan) => {
    Logger.println(`Plan ${colors.bold(plan.slug)}`);
    _(plan.features)
      .sortBy('name')
      .forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));

    if (providerInfos != null) {
      const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');
      if (planType != null && planType.value.toLowerCase() === 'dedicated') {
        const planVersions = Object.keys(providerInfos.dedicated);
        const versions = planVersions.map((version) => {
          if (version === providerInfos.defaultDedicatedVersion) {
            return `${version} (default)`;
          }
          else {
            return version;
          }
        });
        Logger.println(`  Available versions: ${versions.join(', ')}`);

        planVersions.forEach((version) => {
          const features = providerInfos.dedicated[version].features;
          Logger.println(`  Options for version ${version}:`);
          features.forEach(({ name, enabled }) => {
            Logger.println(`    ${name}: default=${enabled}`);
          });
        });
      }
    }
  });
}

async function env (params) {

  const { org, format } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveAddonId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const envFromAddon = await addon_js.getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);

  switch (format) {

    case 'json': {
      const envFromAddonJson = Object.fromEntries(
        envFromAddon.map(({ name, value }) => [name, value]),
      );
      Logger.println(JSON.stringify(envFromAddonJson, null, 2));
      break;
    }

    case 'shell':
      Logger.println(envVars_js.toNameEqualsValueString(envFromAddon, { addExports: true }));
      break;

    case 'human':
    default:
      Logger.println(envVars_js.toNameEqualsValueString(envFromAddon, { addExports: false }));
  }
}

async function list$8 (params) {
  const { 'only-aliases': onlyAliases, json } = params.options;

  const { apps } = await loadApplicationConf();

  const formattedApps = formatApps(apps, onlyAliases, json);
  Logger.println(formattedApps);
}
function formatApps (apps, onlyAliases, json) {

  if (json) {
    if (onlyAliases) {
      apps = apps.map((a) => a.alias);
    }
    return JSON.stringify(apps, null, 2);
  }
  else {
    if (onlyAliases) {
      return apps.map((a) => a.alias).join('\n');
    }
    else {
      return apps
        .map((app) =>
          [
            `Application ${app.name}`,
            `  alias: ${colors.bold(app.alias)}`,
            `  id: ${app.app_id}`,
            `  deployment url: ${app.deploy_url}`].join('\n'),
        )
        .join('\n\n');
    }
  }
}

async function cancelDeploy (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const deployments = await application$1.getAllDeployments({ id: ownerId, appId, limit: 1 }).then(sendToApi);

  if (deployments.length === 0 || (deployments[0].action !== 'DEPLOY' || deployments[0].state !== 'WIP')) {
    throw new Error('There is no ongoing deployment for this application');
  }

  const deploymentId = deployments[0].id;
  await application$1.cancelDeployment({ id: ownerId, appId, deploymentId }).then(sendToApi);

  Logger.println('Deployment cancelled!');
}

async function get (params) {
  const [configurationName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const app = await get$1(ownerId, appId);

  if (configurationName == null) {
    print(app);
  }
  else {
    printById(app, configurationName);
  }
}

async function set$2 (params) {
  const [configurationName, configurationValue] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const config = getById(configurationName);

  if (config != null) {
    const app = await application$1.update({ id: ownerId, appId }, { [config.name]: parse(config, configurationValue) }).then(sendToApi);

    printById(app, configurationName);
  }
}

async function update (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const options = parseOptions(params.options);

  if (Object.keys(options).length === 0) {
    throw new Error('No configuration to update');
  }

  const app = await application$1.update({ id: ownerId, appId }, options).then(sendToApi);

  for (const configName of Object.keys(options)) {
    printByName(app, configName);
  }
}

async function create$1 (params) {
  const { type: typeName } = params.options;
  const [name] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo } = params.options;
  const github = getGithubDetails(githubOwnerRepo);

  const app = await create$4(name, typeName, region, orgaIdOrName, github);
  await addLinkedApplication(app, alias);

  Logger.println('Your application has been successfully created!');
}
function getGithubDetails (githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

async function deleteApp (params) {
  const { alias, yes: skipConfirmation } = params.options;
  const appDetails = await getAppDetails({ alias });

  await deleteApp$1(appDetails, skipConfirmation);
  await unlinkRepo(appDetails.alias);

  Logger.println('The application has been deleted');
}

const delay$1 = util.promisify(setTimeout);

const DEPLOYMENT_POLLING_DELAY = 5000;
const BACKOFF_FACTOR = 1.25;
const INIT_RETRY_TIMEOUT = 1500;
const MAX_RETRY_COUNT = 5;

async function waitForDeploymentStart ({ ownerId, appId, deploymentId, commitId, knownDeployments }) {

  return waitFor(async () => {
    try {

      // In a deploy situation, we don't have the deployment ID so we get the latest deployments,
      // then we match by commit ID and we filter out "known deployments" that existed before the deploy.
      // In a restart situation, we have a deployment ID but fetching it too soon may result in an error so we get latest deployments,
      // then we just match on the deployment ID.
      const deploymentList = await application$1.getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);
      const deployment = deploymentList.find((d) => {
        if (deploymentId != null) {
          return d.uuid === deploymentId;
        }
        if (commitId != null && Array.isArray(knownDeployments)) {
          const isNew = knownDeployments.every(({ uuid }) => uuid !== d.uuid);
          return isNew && d.commit === commitId;
        }
        return false;
      });
      if (deployment != null) {
        Logger.debug(`Deployment has started (state:${deployment.state})`);
        return deployment;
      }
      Logger.debug('Deployment cannot be found yet');
    }
    catch (e) {
      Logger.debug('Failed to retrieve deployment');
      throw e;
    }
  });
}

async function waitForDeploymentEnd ({ ownerId, appId, deploymentId }) {
  return waitFor(async () => {
    try {
      const deployment = await application$1.getDeployment({ id: ownerId, appId, deploymentId }).then(sendToApi);
      // If it's not WIP, it means it has ended (OK, FAIL, CANCELLED…)
      if (deployment.state !== 'WIP') {
        Logger.debug(`Deployment is finished (state:${deployment.state})`);
        return deployment;
      }
      Logger.debug(`Deployment is not finished yet (state:${deployment.state})`);
    }
    catch (e) {
      Logger.debug('Failed to retrieve current deployment status');
      throw e;
    }
  });
}

// Calls an async function "fetchResult"
// Return fetchResult's result if it's not null
// Retry with simple "infinite polling" if fetchResult succeeds and returns null
// Retry with exponential backoff if fetchResult fails
async function waitFor (fetchResult) {

  let failCount = 0;

  while (true) {

    try {

      const result = await fetchResult();
      if (result != null) {
        return result;
      }

      // Reset fail count, we only use it to limit failed API calls
      failCount = 0;

      // Retry with simple polling when API calls succeed
      await delay$1(DEPLOYMENT_POLLING_DELAY);
    }
    catch (e) {
      // If only retry if it's a network error
      if (e.code !== 'EAI_AGAIN') {
        throw e;
      }

      // Increment fail count so we don't retry more than MAX_RETRY_COUNT
      failCount += 1;
      if (failCount > MAX_RETRY_COUNT) {
        throw new Error(`Failed ${MAX_RETRY_COUNT} times!`);
      }

      // If API call fails, retry with an exponential backoff
      await delay$1(INIT_RETRY_TIMEOUT * (BACKOFF_FACTOR ** failCount));
    }
  }
}

function isCleverMessage (line) {
  return line._source.syslog_program === '/home/bas/rubydeployer/deployer.rb';
}
function isDeploymentSuccessMessage (line) {
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'successfully deployed in');
}
function isDeploymentFailedMessage (line) {
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'deploy failed in');
}
function isBuildSucessMessage (line) {
  return isCleverMessage(line)
    && _.startsWith(line._source['@message'].toLowerCase(), 'build succeeded in');
}
function formatLogLine (line) {
  const { '@timestamp': timestamp, '@message': message } = line._source;
  if (isDeploymentSuccessMessage(line)) {
    return `${timestamp}: ${colors.bold.green(message)}`;
  }
  else if (isDeploymentFailedMessage(line)) {
    return `${timestamp}: ${colors.bold.red(message)}`;
  }
  else if (isBuildSucessMessage(line)) {
    return `${timestamp}: ${colors.bold.blue(message)}`;
  }
  return `${timestamp}: ${message}`;
}

async function displayLiveLogs ({ appId, filter, until, deploymentId }, deferred) {

  const { apiHost, tokens } = await getHostAndTokens();
  const logsStream = new logs_node_js.LogsStream({ apiHost, tokens, appId, filter, deploymentId });

  logsStream
    .on('open', () => Logger.debug('SSE for logs (open) ' + JSON.stringify({ appId, filter, deploymentId })))
    .on('log', (line) => {
      const { '@timestamp': timestamp } = line._source;
      if (until != null && new Date(timestamp) > until) {
        logsStream.close();
      }
      else {
        Logger.println(formatLogLine(line));
      }
    })
    .on('ping', () => Logger.debug('SSE for logs (ping)'))
    .on('close', ({ reason }) => Logger.debug('SSE for logs (close) ' + reason))
    .on('error', (error) => deferred.reject(error));

  logsStream.open({ autoRetry: true, maxRetryCount: 6 });

  return logsStream;
}

async function displayLogs ({ appAddonId, until, since, filter, deploymentId }) {

  const now = new Date();

  const fetchOldLogs = (since == null || since < now);
  if (fetchOldLogs) {

    const oldLogs = await log_js.getOldLogs({
      appId: appAddonId,
      before: until != null ? until.toISOString() : null,
      after: since != null ? since.toISOString() : null,
      filter,
      deployment_id: deploymentId,
    }).then(sendToApi);

    for (const line of oldLogs.reverse()) {
      Logger.println(formatLogLine(line));
    }
  }

  // No need to fetch live logs if until date is in the past
  if (until != null && until < now) {
    return;
  }

  const deferred = new Deferred();

  await displayLiveLogs({ appId: appAddonId, filter, deploymentId, until }, deferred);

  return deferred.promise;
}

async function watchDeploymentAndDisplayLogs ({ ownerId, appId, deploymentId, commitId, knownDeployments, quiet, follow }) {

  Logger.println('Waiting for deployment to start…');
  const deployment = await waitForDeploymentStart({ ownerId, appId, deploymentId, commitId, knownDeployments });
  Logger.println(colors.bold.blue(`Deployment started (${deployment.uuid})`));

  const deferred = new Deferred();
  let logsStream;

  if (!quiet) {
    // About the deferred…
    // If displayLiveLogs() throws an error,
    // the async function we're in (watchDeploymentAndDisplayLogs) will stop here and the error will be passed to the parent.
    // displayLiveLogs() defines callback listeners so if it catches error in those callbacks,
    // it has no proper way to bubble up the error here.
    // Using the deferred enables this.
    logsStream = await displayLiveLogs({ appId, deploymentId: deployment.uuid }, deferred);
  }

  Logger.println('Waiting for application logs…');

  // Wait for deployment end (or an error thrown by logs with the deferred)
  const deploymentEnded = await Promise.race([
    waitForDeploymentEnd({ ownerId, appId, deploymentId: deployment.uuid }),
    deferred.promise,
  ]);

  if (!quiet && !follow) {
    logsStream.close();
  }

  if (deploymentEnded.state === 'OK') {
    Logger.println(colors.bold.green('Deployment successful'));
  }
  else if (deploymentEnded.state === 'CANCELLED') {
    throw new Error('Deployment was cancelled. Please check the activity');
  }
  else {
    throw new Error('Deployment failed. Please check the logs');
  }
}

// Once the API call to redeploy() has been triggered successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network failures)
async function deploy (params) {
  const { alias, branch: branchName, quiet, force, follow } = params.options;

  const appData = await getAppDetails({ alias });
  const { ownerId, appId } = appData;
  const branchRefspec = await getFullBranch(branchName);

  const commitIdToPush = await getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await getRemoteCommit(appData.deployUrl);
  const deployedCommitId = await get$1(ownerId, appId)
    .then(({ commitId }) => commitId);

  await addRemote(appData.alias, appData.deployUrl);

  if (commitIdToPush === remoteHeadCommitId) {
    const upToDateMessage = `The clever-cloud application is up-to-date (${remoteHeadCommitId}). Try this command to restart the application:`;
    if (commitIdToPush !== deployedCommitId) {
      throw new Error(`${upToDateMessage}\nclever restart --commit ${commitIdToPush}`);
    }
    throw new Error(`${upToDateMessage}\nclever restart`);
  }

  if (remoteHeadCommitId == null || deployedCommitId == null) {
    Logger.println('App is brand new, no commits on remote yet');
  }
  else {
    Logger.println(`Remote git head commit   is ${colors.green(remoteHeadCommitId)}`);
    Logger.println(`Current deployed commit  is ${colors.green(deployedCommitId)}`);
  }
  Logger.println(`New local commit to push is ${colors.green(commitIdToPush)} (from ${colors.green(branchRefspec)})`);

  // It's sometimes tricky to figure out the deployment ID for the current git push.
  // We on have the commit ID but there in a situation where the last deployment was cancelled, it may have the same commit ID.
  // So before pushing, we get the last deployments so we can after the push figure out which deployment is new…
  const knownDeployments = await application$1.getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);

  Logger.println('Pushing source code to Clever Cloud…');
  await push(appData.deployUrl, branchRefspec, force)
    .catch(async (e) => {
      const isShallow$1 = await isShallow();
      if (isShallow$1) {
        throw new Error('Failed to push your source code because your repository is shallow and therefore cannot be pushed to the Clever Cloud remote.');
      }
      else {
        throw e;
      }
    });
  Logger.println(colors.bold.green('Your source code has been pushed to Clever Cloud.'));

  return watchDeploymentAndDisplayLogs({ ownerId, appId, commitId: commitIdToPush, knownDeployments, quiet, follow });
}

async function diag () {

  const userId = await getCurrentId().catch(() => null);
  const authDetails = await loadOAuthConf();

  Logger.println('clever-tools  ' + colors.green(pkg$1.version));
  Logger.println('Node.js       ' + colors.green(process.version));

  Logger.println('Platform      ' + colors.green(os.platform()));
  Logger.println('Release       ' + colors.green(os.release()));
  Logger.println('Architecture  ' + colors.green(process.arch));

  // Linux specific
  const linuxInfos = await linuxReleaseInfo.releaseInfo().then(({ pretty_name, name, id }) => pretty_name || name || id).catch(() => null);
  if (linuxInfos != null) {
    Logger.println('Linux         ' + colors.green(linuxInfos));
  }

  Logger.println('Shell         ' + colors.green(process.env.SHELL));

  const isPackaged = (process.pkg != null);
  Logger.println('Packaged      ' + colors.green(isPackaged));
  Logger.println('Exec path     ' + colors.green(process.execPath));
  Logger.println('Config file   ' + colors.green(conf.CONFIGURATION_FILE));
  Logger.println('Auth source   ' + colors.green(authDetails.source));

  const oauthToken = (authDetails.token != null)
    ? colors.green(authDetails.token)
    : colors.red('(none)');
  Logger.println('oAuth token   ' + oauthToken);

  if (authDetails.token != null) {
    if (userId != null) {
      Logger.println('User ID       ' + colors.green(userId));
    }
    else {
      Logger.println('User ID       ' + colors.red('Authentication failed'));
    }
  }
  else {
    Logger.println('User ID       ' + colors.red('Not connected'));
  }
}

function getFavouriteDomain ({ ownerId, appId }) {
  return application$1.getFavouriteDomain({ id: ownerId, appId })
    .then(sendToApi)
    .then(({ fqdn }) => fqdn)
    .catch((error) => {
      if (error.id === 4021) {
        // No favourite vhost
        return null;
      }
      throw error;
    });
}

async function list$7 (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const app = await application$1.get({ id: ownerId, appId }).then(sendToApi);
  const favouriteDomain = await getFavouriteDomain({ ownerId, appId });
  return app.vhosts.forEach(({ fqdn }) => {
    const prefix = (fqdn === favouriteDomain)
      ? '* '
      : '  ';
    Logger.println(prefix + fqdn);
  });
}

async function add$3 (params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await application$1.addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully saved');
}

async function getFavourite (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const favouriteDomain = await getFavouriteDomain({ ownerId, appId });

  if (favouriteDomain == null) {
    return Logger.println('No favourite domain set');
  }

  return Logger.println(favouriteDomain);
}

async function setFavourite (params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  await application$1.markFavouriteDomain({ id: ownerId, appId }, { fqdn }).then(sendToApi);
  Logger.println('Your favourite domain has been successfully set');
}

async function unsetFavourite (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  await application$1.unmarkFavouriteDomain({ id: ownerId, appId }).then(sendToApi);
  Logger.println('Favourite domain has been successfully unset');
}

async function rm$3 (params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await application$1.removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println('Your domain has been successfully removed');
}

// TODO: This could be useful in other commands
async function getAppOrAddonId ({ alias, addonId }) {
  return (addonId != null)
    ? addonId
    : getAppDetails({ alias }).then(({ appId }) => appId);
}

async function list$6 (params) {
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  const drains = await log_js.getDrains({ appId: appIdOrAddonId }).then(sendToApi);

  if (drains.length === 0) {
    Logger.println(`There are no drains for ${appIdOrAddonId}`);
  }

  drains.forEach((drain) => {
    const { id, state, target: { url, drainType } } = drain;
    Logger.println(`${id} -> ${state} for ${url} as ${drainType}`);
  });
}

async function create (params) {
  const [drainTargetType, drainTargetURL] = params.args;
  const { alias, addon: addonId, username, password, 'api-key': apiKey } = params.options;
  const drainTargetCredentials = { username, password };
  const drainTargetConfig = { apiKey };

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  const body = createDrainBody(appIdOrAddonId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig);
  await log_js.createDrain({ appId: appIdOrAddonId }, body).then(sendToApi);

  Logger.println('Your drain has been successfully saved');
}

async function rm$2 (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await log_js.deleteDrain({ appId: appIdOrAddonId, drainId }).then(sendToApi);

  Logger.println('Your drain has been successfully removed');
}

async function enable (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await log_js.updateDrainState({ appId: appIdOrAddonId, drainId }, { state: 'ENABLED' }).then(sendToApi);

  Logger.println('Your drain has been enabled');
}

async function disable (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await log_js.updateDrainState({ appId: appIdOrAddonId, drainId }, { state: 'DISABLED' }).then(sendToApi);

  Logger.println('Your drain has been disabled');
}

function readStdin () {

  return new Promise((resolve, reject) => {

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const lines = [];
    rl.on('line', (line) => {
      lines.push(line);
    });

    rl.on('close', () => {
      const text = lines.join('\n');
      resolve(text);
    });

    rl.on('error', reject);
  });
}

// The JSON input format for variables is:
// an array of objects, each having:
// a "name" property with a string and value
// a "value" property with a string and value
// TODO: This should be moved and unit tested in the clever-client repo
function parseFromJson (rawStdin) {

  let variables;
  try {
    variables = JSON.parse(rawStdin);
  }
  catch (e) {
    throw new Error(`Error when parsing JSON input: ${e.message}`);
  }

  if (!Array.isArray(variables) || variables.some((entry) => typeof entry !== 'object')) {
    throw new Error('The input was valid JSON but it does not follow the correct format. It must be an array of objects.');
  }

  const someEntriesDontHaveNameAndValueAsString = variables.some(({ name, value }) => {
    return (typeof name !== 'string') || (typeof value !== 'string');
  });
  if (someEntriesDontHaveNameAndValueAsString) {
    throw new Error('The input was a valid JSON array of objects but all entries must have properties "name" and "value" of type string. Ex: { "name": "THE_NAME", "value": "the value" }');
  }

  const namesOccurences = _countBy(variables, 'name');
  const duplicatedNames = Object
    .entries(namesOccurences)
    .filter(([name, count]) => count > 1)
    .map(([name]) => `"${name}"`)
    .join(', ');

  if (duplicatedNames.length !== 0) {
    throw new Error(`Some variable names defined multiple times: ${duplicatedNames}`);
  }

  const invalidNames = variables
    .filter(({ name }) => !envVars_js.validateName(name))
    .map(({ name }) => `"${name}"`)
    .join(', ');

  if (invalidNames.length !== 0) {
    throw new Error(`Some variable names are invalid: ${invalidNames}`);
  }

  return envVars_js.toNameValueObject(variables);
}

function parseFromNameEqualsValue (rawStdin) {
  const { variables, errors } = envVars_js.parseRaw(rawStdin);

  if (errors.length !== 0) {

    const formattedErrors = errors
      .map(({ type, name, pos }) => {
        if (type === envVars_js.ERROR_TYPES.INVALID_NAME) {
          return `line ${pos.line}: ${name} is not a valid variable name`;
        }
        if (type === envVars_js.ERROR_TYPES.DUPLICATED_NAME) {
          return `line ${pos.line}: be careful, the name ${name} is already defined`;
        }
        if (type === envVars_js.ERROR_TYPES.INVALID_LINE) {
          return `line ${pos.line}: this line is not valid, the correct pattern is: NAME="VALUE"`;
        }
        if (type === envVars_js.ERROR_TYPES.INVALID_VALUE) {
          return `line ${pos.line}: the value is not valid, if you use quotes, you need to escape them like this: \\" or quote the whole value.`;
        }
        return 'Unknown error in your input';
      }).join('\n');

    throw new Error(formattedErrors);
  }

  return envVars_js.toNameValueObject(variables);
}

async function readVariablesFromStdin (format) {

  const rawStdin = await readStdin();

  switch (format) {
    case 'name-equals-value':
      return parseFromNameEqualsValue(rawStdin);
    case 'json':
      return parseFromJson(rawStdin);
    default:
      throw new Error('Unrecognized environment input format. Available formats are \'name-equals-value\' and \'json\'');
  }
}

async function list$5 (params) {
  const { alias, 'add-export': addExports } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
    application.getAllEnvVars({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForAddons({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForDependencies({ id: ownerId, appId }).then(sendToApi),
  ]);

  Logger.println('# Manually set env variables');
  Logger.println(envVars_js.toNameEqualsValueString(envFromApp, { addExports }));

  envFromAddons.forEach((addon) => {
    Logger.println('# Addon ' + addon.addon_name);
    Logger.println(envVars_js.toNameEqualsValueString(addon.env, { addExports }));
  });

  envFromDeps.forEach((dep) => {
    Logger.println('# Dependency ' + dep.app_name);
    Logger.println(envVars_js.toNameEqualsValueString(dep.env, { addExports }));
  });
}
async function set$1 (params) {
  const [envName, value] = params.args;
  const { alias } = params.options;

  const nameIsValid = envVars_js.validateName(envName);
  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  const { ownerId, appId } = await getAppDetails({ alias });

  await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

  Logger.println('Your environment variable has been successfully saved');
}
async function rm$1 (params) {
  const [envName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  await application.removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

  Logger.println('Your environment variable has been successfully removed');
}
async function importEnv$1 (params) {
  const { alias, json } = params.options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await getAppDetails({ alias });

  const envVars = await readVariablesFromStdin(format);
  await application.updateAllEnvVars({ id: ownerId, appId }, envVars).then(sendToApi);

  Logger.println('Environment variables have been set');
}
async function importVarsFromLocalEnv (params) {
  const [envNames] = params.args;
  const { alias } = params.options;

  for (const envName of envNames) {
    const nameIsValid = envVars_js.validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }
  }

  const { ownerId, appId } = await getAppDetails({ alias });

  for (const envName of envNames) {
    const value = process.env[envName] || '';
    await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
  }

  Logger.println('Your environment variables have been successfully saved');
}

async function link (params) {
  const [app] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  if (app.app_id != null && orgaIdOrName != null) {
    Logger.warn('You\'ve specified a unique application ID, organisation option will be ignored');
  }

  await linkRepo(app, orgaIdOrName, alias);

  Logger.println('Your application has been successfully linked!');
}

const delay = util.promisify(setTimeout);

// 20 random bytes as Base64URL
function randomToken () {
  return crypto.randomBytes(20).toString('base64').replace(/\//g, '-').replace(/\+/g, '_').replace(/=/g, '');
}

const POLLING_INTERVAL = 2000;
const POLLING_MAX_TRY_COUNT = 60;

function pollOauthData (url, tryCount = 0) {

  if (tryCount >= POLLING_MAX_TRY_COUNT) {
    throw new Error('Something went wrong while trying to log you in.');
  }
  if (tryCount > 1 && tryCount % 10 === 0) {
    Logger.println("We're still waiting for the login process (in your browser) to be completed…");
  }

  return superagent
    .get(url)
    .send()
    .then(({ body }) => body)
    .catch(async (e) => {
      if (e.status === 404) {
        await delay(POLLING_INTERVAL);
        return pollOauthData(url, tryCount + 1);
      }
      throw new Error('Something went wrong while trying to log you in.');
    });
}

async function loginViaConsole () {

  const cliToken = randomToken();

  const consoleUrl = new URL(conf.CONSOLE_TOKEN_URL);
  consoleUrl.searchParams.set('cli_version', pkg$1.version);
  consoleUrl.searchParams.set('cli_token', cliToken);

  const cliPollUrl = new URL(conf.API_HOST);
  cliPollUrl.pathname = '/v2/self/cli_tokens';
  cliPollUrl.searchParams.set('cli_token', cliToken);

  Logger.debug('Try to login to Clever Cloud…');
  Logger.println(`Opening ${colors.green(consoleUrl.toString())} in your browser to log you in…`);
  await openPage(consoleUrl.toString(), { wait: false });

  return pollOauthData(cliPollUrl.toString());
}

async function login (params) {
  const { token, secret } = params.options;
  const isLoginWithArgs = (token != null && secret != null);
  const isInteractiveLogin = (token == null && secret == null);

  if (isLoginWithArgs) {
    return writeOAuthConf({ token, secret });
  }

  if (isInteractiveLogin) {
    const oauthData = await loginViaConsole();
    await writeOAuthConf(oauthData);
    const { name, email } = await getCurrent();
    const formattedName = name || colors.red.bold('[unspecified name]');
    return Logger.println(`Login successful as ${formattedName} <${email}>`);
  }

  throw new Error('Both `--token` and `--secret` have to be defined');
}

async function logout () {
  // write empty object
  await writeOAuthConf({});
  Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
}

async function appLogs (params) {
  const { alias, after: since, before: until, search, 'deployment-id': deploymentId } = params.options;
  const { addon: addonId } = params.options;

  // ignore --search ""
  const filter = (search !== '') ? search : null;
  const appAddonId = addonId || await getAppDetails({ alias }).then(({ appId }) => appId);

  Logger.println('Waiting for application logs…');

  return displayLogs({ appAddonId, since, until, filter, deploymentId });
}

async function makeDefault (params) {
  const [alias] = params.args;

  await setDefault(alias);

  Logger.println(`The application ${alias} has been set as default`);
}

function displayEmailhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  if (hook.notified) {
    Logger.println('  to:');
    hook.notified.forEach((target) => Logger.println(`    ${target.target || 'whole team'}`));
  }
  else {
    Logger.println('  to: whole team');
  }
  Logger.println();
}

async function list$4 (params) {
  const { org, 'list-all': listAll } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await notification_js.getEmailhooks({ ownerId }).then(sendToApi);

  hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .forEach((hook) => displayEmailhook(hook));
}

function getEmailNotificationTargets (notifTargets) {

  if (notifTargets == null) {
    return [];
  }

  return notifTargets
    .map((el) => {
      if (el.includes('@')) {
        return { type: 'email', target: el };
      }
      if (el.startsWith('user_')) {
        return { type: 'userid', target: el };
      }
      if (el.toLowerCase() === 'organisation') {
        return { type: 'organisation' };
      }
      return null;
    })
    .filter((e) => e != null);
}

async function add$2 (params) {
  const { org, event: events, service, notify: notifTargets } = params.options;
  const [name] = params.args;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

  const body = {
    name,
    notified: getEmailNotificationTargets(notifTargets),
    scope: (appId != null && service == null) ? [appId] : service,
    events,
  };

  await notification_js.createEmailhook({ ownerId }, body).then(sendToApi);

  Logger.println('The webhook has been added');
}

async function remove$2 (params) {
  const { org } = params.options;
  const [notificationId] = params.args;

  const ownerId = await getOrgaIdOrUserId(org);
  await notification_js.deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

  Logger.println('The notification has been successfully removed');
}

async function getBest (appId, orgaId) {
  Logger.debug('Trying to get the favourite vhost for ' + appId);
  return application$1.getFavouriteDomain({ id: orgaId, appId }).then(sendToApi)
    .catch(async (e) => {

      if (e.status !== 404) {
        throw e;
      }

      Logger.debug('No favourite vhost defined for ' + appId + ', selecting the best one');
      const allDomains = await application$1.getAllDomains({ id: orgaId, appId }).then(sendToApi);
      const result = selectBest(allDomains);

      if (result == null) {
        throw new Error('Couldn\'t find a domain name');
      }

      return result;
    });
}

function selectBest (vhosts) {
  const customVhost = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.endsWith('.cleverapps.io');
  });
  const withoutDefaultDomain = _.find(vhosts, (vhost) => {
    return !vhost.fqdn.match(/^app-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.cleverapps\.io$/);
  });
  return customVhost || withoutDefaultDomain || vhosts[0];
}

async function open (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const vhost = await getBest(appId, ownerId);
  const url = 'https://' + vhost.fqdn;

  Logger.println('Opening the application in your browser');
  await openPage(url, { wait: false });
}

async function openConsole (params) {
  const { alias } = params.options;

  const { ownerId, appId } = await getAppDetails({ alias });

  Logger.println('Opening the console in your browser');

  const prefixPath = (ownerId.startsWith('user_')) ? 'users/me' : `organisations/${ownerId}`;
  const url = `https://console.clever-cloud.com/${prefixPath}/applications/${appId}`;
  await openPage(url, { wait: false });
}

async function profile () {
  const { id, name, email, preferredMFA } = await getCurrent();
  const has2FA = (preferredMFA != null && preferredMFA !== 'NONE') ? 'yes' : 'no';
  const formattedName = name || colors.red.bold('[not specified]');
  Logger.println('You\'re currently logged in as:');
  Logger.println('User id          ' + id);
  Logger.println('Name             ' + formattedName);
  Logger.println('Email            ' + email);
  Logger.println('Two factor auth  ' + has2FA);
}

async function list$3 (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  const pairs = Object.entries(publishedConfigs)
    .map(([name, value]) => ({ name, value }));

  Logger.println('# Published configs');
  Logger.println(envVars_js.toNameEqualsValueString(pairs));
}
async function set (params) {
  const [varName, varValue] = params.args;
  const { alias } = params.options;

  const nameIsValid = envVars_js.validateName(varName);
  if (!nameIsValid) {
    throw new Error(`Published config name ${varName} is invalid`);
  }

  const { ownerId, appId } = await getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  publishedConfigs[varName] = varValue;
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully saved');
}
async function rm (params) {
  const [varName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  delete publishedConfigs[varName];
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully removed');
}
async function importEnv (params) {
  const { alias, json } = params.options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await getAppDetails({ alias });

  const publishedConfigs = await readVariablesFromStdin(format);
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published configs have been set');
}

// Once the API call to redeploy() has been triggerred successfully,
// the rest (waiting for deployment state to evolve and displaying logs) is done with auto retry (resilient to network pb)
async function restart (params) {
  const { alias, quiet, commit, 'without-cache': withoutCache, follow } = params.options;

  const { ownerId, appId, name: appName } = await getAppDetails({ alias });
  const fullCommitId = await resolveFullCommitId(commit);
  const app = await get$1(ownerId, appId);
  const remoteCommitId = app.commitId;

  const commitId = fullCommitId || remoteCommitId;
  if (commitId != null) {
    const cacheSuffix = withoutCache ? ' without using cache' : '';
    Logger.println(`Restarting ${appName} on commit ${colors.green(commitId)}${cacheSuffix}`);
  }

  const redeploy$1 = await redeploy(ownerId, appId, fullCommitId, withoutCache);

  return watchDeploymentAndDisplayLogs({ ownerId, appId, deploymentId: redeploy$1.deploymentId, quiet, follow });
}

function validateOptions (options) {

  let { flavor, 'min-flavor': minFlavor, 'max-flavor': maxFlavor } = options;
  let { instances, 'min-instances': minInstances, 'max-instances': maxInstances, 'build-flavor': buildFlavor } = options;

  if ([flavor, minFlavor, maxFlavor, instances, minInstances, maxInstances, buildFlavor].every((v) => v == null)) {
    throw new Error('You should provide at least 1 option');
  }

  if (flavor != null) {
    if (minFlavor != null || maxFlavor != null) {
      throw new Error('You can\'t use --flavor and --min-flavor or --max-flavor at the same time');
    }
    minFlavor = flavor;
    maxFlavor = flavor;
  }

  if (instances != null) {
    if (minInstances != null || maxInstances != null) {
      throw new Error('You can\'t use --instances and --min-instances or --max-instances at the same time');
    }
    minInstances = instances;
    maxInstances = instances;
  }

  if (minInstances != null && maxInstances != null && minInstances > maxInstances) {
    throw new Error('min-instances can\'t be greater than max-instances');
  }

  if (minFlavor != null && maxFlavor != null) {
    const minFlavorIndex = listAvailableFlavors().indexOf(minFlavor);
    const maxFlavorIndex = listAvailableFlavors().indexOf(maxFlavor);
    if (minFlavorIndex > maxFlavorIndex) {
      throw new Error('min-flavor can\'t be a greater flavor than max-flavor');
    }
  }

  return { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor };
}

async function scale (params) {
  const { alias } = params.options;
  const { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor } = validateOptions(params.options);
  const { ownerId, appId } = await getAppDetails({ alias });

  await setScalability(appId, ownerId, {
    minFlavor,
    maxFlavor,
    minInstances,
    maxInstances,
  }, buildFlavor);

  Logger.println('App rescaled successfully');
}

async function list$2 (params) {
  const { alias, 'show-all': showAll, 'only-apps': onlyApps, 'only-addons': onlyAddons } = params.options;
  if (onlyApps && onlyAddons) {
    throw new Error('--only-apps and --only-addons are mutually exclusive');
  }

  const { ownerId, appId } = await getAppDetails({ alias });

  if (!onlyAddons) {
    const apps = await listDependencies(ownerId, appId, showAll);
    Logger.println('Applications:');
    apps.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
  }

  if (!onlyApps) {
    const addons = await list$b(ownerId, appId, showAll);
    Logger.println('Addons:');
    addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
  }
}

async function linkApp (params) {
  const { alias } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await getAppDetails({ alias });

  await link$2(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully linked`);
}

async function unlinkApp (params) {
  const { alias } = params.options;
  const [dependency] = params.args;
  const { ownerId, appId } = await getAppDetails({ alias });

  await unlink$2(ownerId, appId, dependency);
  Logger.println(`App ${dependency.app_id || dependency.app_name} successfully unlinked`);
}

async function linkAddon (params) {
  const { alias } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await getAppDetails({ alias });

  await link$1(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully linked`);
}

async function unlinkAddon (params) {
  const { alias } = params.options;
  const [addon] = params.args;
  const { ownerId, appId } = await getAppDetails({ alias });

  await unlink$1(ownerId, appId, addon);
  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully unlinked`);
}

async function ssh (params) {
  const { alias, 'identity-file': identityFile } = params.options;

  const { appId } = await getAppDetails({ alias });
  const sshParams = ['-t', conf.SSH_GATEWAY, appId];
  if (identityFile != null) {
    sshParams.push('-i', identityFile);
  }

  await new Promise((resolve, reject) => {
    // TODO: we should catch errors
    const sshProcess = child_process.spawn('ssh', sshParams, { stdio: 'inherit' });
    sshProcess.on('exit', resolve);
    sshProcess.on('error', reject);
  });
}

function displayGroupInfo (instances, commit) {
  return `(${displayFlavors(instances)},  Commit: ${commit || 'N/A'})`;
}

function displayFlavors (instances) {
  return _(instances)
    .groupBy((i) => i.flavor.name)
    .map((instances, flavorName) => `${instances.length}*${flavorName}`)
    .value()
    .join(', ');
}

function computeStatus (instances, app) {
  const upInstances = _.filter(instances, ({ state }) => state === 'UP');
  const isUp = !_.isEmpty(upInstances);
  const upCommit = _(upInstances).map('commit').head();

  const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
  const isDeploying = !_.isEmpty(deployingInstances);
  const deployingCommit = _(deployingInstances).map('commit').head();

  const statusMessage = isUp
    ? `${colors.bold.green('running')} ${displayGroupInfo(upInstances, upCommit)}`
    : colors.bold.red('stopped');

  const statusLine = `${app.name}: ${statusMessage}`;
  const deploymentLine = isDeploying
    ? `Deployment in progress ${displayGroupInfo(deployingInstances, deployingCommit)}`
    : '';

  return [statusLine, deploymentLine].join('\n');
}

function displayScalability (app) {

  const { minFlavor, maxFlavor, minInstances, maxInstances } = app.instance;

  const vertical = (minFlavor.name === maxFlavor.name)
    ? minFlavor.name
    : `${minFlavor.name} to ${maxFlavor.name}`;

  const horizontal = (minInstances === maxInstances)
    ? minInstances
    : `${minInstances} to ${maxInstances}`;

  const enabled = (minFlavor.name !== maxFlavor.name)
    || (minInstances !== maxInstances);

  return `Scalability:
  Auto scalability: ${enabled ? colors.green('enabled') : colors.red('disabled')}
  Scalers: ${colors.bold(horizontal)}
  Sizes: ${colors.bold(vertical)}
  Dedicated build: ${app.separateBuild ? colors.bold(app.buildFlavor.name) : colors.red('disabled')}`;
}

async function status (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const instances = await application$1.getAllInstances({ id: ownerId, appId }).then(sendToApi);
  const app = await application$1.get({ id: ownerId, appId }).then(sendToApi);

  Logger.println(computeStatus(instances, app));
  Logger.println(displayScalability(app));
}

async function stop (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println('App successfully stopped!');
}

async function listNamespaces (params) {
  const namespaces = await getNamespaces(params);

  Logger.println('Available namespaces: ' + namespaces.map(({ namespace }) => namespace).join(', '));
}
async function list$1 (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const redirs = await application.getTcpRedirs({ id: ownerId, appId }).then(sendToApi);

  if (redirs.length === 0) {
    Logger.println('No active TCP redirection for this application');
  }
  else {
    Logger.println('Enabled TCP redirections:');
    for (const { namespace, port } of redirs) {
      Logger.println(port + ' on ' + namespace);
    }
  }
}

async function acceptPayment (result, skipConfirmation) {
  if (!skipConfirmation) {
    result.lines.forEach(({ description, VAT, price }) => Logger.println(`${description}\tVAT: ${VAT}%\tPrice: ${price}€`));
    Logger.println(`Total (without taxes): ${result.totalHT}€`);
    Logger.println(colors.bold(`Total (with taxes): ${result.totalTTC}€`));

    await confirm(
      `You're about to pay ${result.totalTTC}€, confirm? (yes or no) `,
      'No confirmation, aborting TCP redirection creation',
    );
  }
}

async function add$1 (params) {
  const { alias, namespace, yes: skipConfirmation } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  const { port } = await application.addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi).catch((error) => {
    if (error.status === 402) {
      return acceptPayment(error.response.body, skipConfirmation).then(() => {
        return application.addTcpRedir({ id: ownerId, appId, payment: 'accepted' }, { namespace }).then(sendToApi);
      });
    }
    else {
      throw error;
    }
  });

  Logger.println('Successfully added tcp redirection on port: ' + port);
}
async function remove$1 (params) {
  const [port] = params.args;
  const { alias, namespace } = params.options;
  const { ownerId, appId } = await getAppDetails({ alias });

  await application.removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);

  Logger.println('Successfully removed tcp redirection.');
}

async function unlink (params) {
  const [alias] = params.args;
  const app = await getAppDetails({ alias });

  await unlinkRepo(app.alias);
  Logger.println('Your application has been successfully unlinked!');
}

async function version () {
  Logger.println(pkg$1.version);
}

function displayWebhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  Logger.println('  hooks:');
  hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
  Logger.println();
}

async function list (params) {
  const { org, 'list-all': listAll } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await notification_js.getWebhooks({ ownerId }).then(sendToApi);

  hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .forEach((hook) => displayWebhook(hook));
}

async function add (params) {
  const { org, format, event: events, service } = params.options;
  const [name, hookUrl] = params.args;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

  const body = {
    name,
    urls: [{ format, url: hookUrl }],
    scope: (appId != null && service == null) ? [appId] : service,
    events,
  };

  await notification_js.createWebhook({ ownerId }, body).then(sendToApi);

  Logger.println('The webhook has been added');
}

async function remove (params) {
  const { org } = params.options;
  const [notificationId] = params.args;

  const ownerId = await getOrgaIdOrUserId(org);
  await notification_js.deleteWebhook({ ownerId, id: notificationId }).then(sendToApi);

  Logger.println('The notification has been successfully removed');
}

const formatTable = formatTable$2();

async function listBackups (params) {

  const { org } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveRealId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const backups = await backups_js.getBackups({ ownerId, ref: addonId }).then(sendToApi);

  if (backups.length === 0) {
    Logger.println('There are no backups yet');
    return;
  }

  const formattedLines = backups
    .sort((a, b) => a.creation_date.localeCompare(b.creation_date))
    .map((backup) => [
      backup.backup_id,
      backup.creation_date,
      backup.status,
    ]);

  const head = [
    'BACKUP ID',
    'CREATION DATE',
    'STATUS',
  ];

  Logger.println(formatTable([
    head,
    ...formattedLines,
  ]));
}

async function downloadBackups (params) {

  const { org, output } = params.options;
  const [addonIdOrRealId, backupId] = params.args;

  const addonId = await resolveRealId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const backups = await backups_js.getBackups({ ownerId, ref: addonId }).then(sendToApi);
  const backup = backups.find((backup) => backup.backup_id === backupId);

  if (backup == null) {
    throw new Error('no backup with this ID');
  }

  const res = await superagent
    .get(backup.download_url)
    .responseType('blob');

  if (output) {
    fs.writeFileSync(output, res.body);
    return;
  }

  process.stdout.write(res.body);
}

async function loadTokens () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

async function curl () {

  // We have to add single quotes on values for the parser
  const curlString = process.argv
    .slice(2)
    .map((str) => !str.startsWith('-') ? `'${str}'` : str)
    .join(' ');

  const curlDetails = util_js.parseCurlCommand(curlString);

  const tokens = await loadTokens();

  const requestParams = {
    method: curlDetails.method,
    url: curlDetails.urlWithoutQuery,
    headers: curlDetails.headers,
    queryParams: curlDetails.query,
  };

  const oauthHeader = await Promise.resolve(requestParams)
    .then(oauth_node_js.addOauthHeader(tokens))
    .then((request) => request.headers.Authorization);

  // Reuse raw curl command
  const curlParams = process.argv.slice(3);

  // Add oauth
  curlParams.push('-H', `Authorization: ${oauthHeader}`);

  child_process.spawn('curl', curlParams, { stdio: 'inherit' });

}

// These need to be set before Logger and other stuffs
if (process.argv.includes('-v') || process.argv.includes('--verbose')) {
  process.env.CLEVER_VERBOSE = '1';
}

// These need to be set before Logger and other stuffs
// Don't log anything in autocomplete mode
if (process.argv.includes('--autocomplete-index')) {
  process.env.CLEVER_QUIET = '1';
}
// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

if (process.pkg == null) {
  updateNotifier({
    pkg: pkg$1,
    tagsUrl: 'https://api.github.com/repos/CleverCloud/clever-tools/tags',
  }).notify({
    getDetails () {
      const docsUrl = 'https://www.clever-cloud.com/doc/clever-tools/getting_started';
      return `\nPlease follow this link to update your clever-tools:\n${docsUrl}`;
    },
  });
}

// Patch cliparse.command so we can catch errors
const cliparseCommand = cliparse.command;

cliparse.command = function (name, options, cb) {
  return cliparseCommand(name, options, (...args) => {
    const promise = cb(...args);
    handleCommandPromise(promise);
  });
};

function run () {

  // ARGUMENTS
  const args = {
    addonIdOrName: cliparse.argument('addon-id', {
      description: 'Addon ID (or name, if unambiguous)',
      parser: addonIdOrName,
    }),
    addonName: cliparse.argument('addon-name', { description: 'Addon name' }),
    addonProvider: cliparse.argument('addon-provider', { description: 'Addon provider' }),
    alias: cliparse.argument('app-alias', { description: 'Application alias' }),
    appIdOrName: cliparse.argument('app-id', {
      description: 'Application ID (or name, if unambiguous)',
      parser: appIdOrName,
    }),
    appNameCreation: cliparse.argument('app-name', { description: 'Application name' }),
    backupId: cliparse.argument('backup-id', { description: 'A Database backup ID (format: UUID)' }),
    databaseId: cliparse.argument('database-id', { description: 'Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)' }),
    drainId: cliparse.argument('drain-id', { description: 'Drain ID' }),
    drainType: cliparse.argument('drain-type', {
      description: 'Drain type',
      complete: listDrainTypes,
    }),
    drainUrl: cliparse.argument('drain-url', { description: 'Drain URL' }),
    fqdn: cliparse.argument('fqdn', { description: 'Domain name of the Clever Cloud application' }),
    notificationName: cliparse.argument('name', { description: 'Notification name' }),
    notificationId: cliparse.argument('notification-id', { description: 'Notification ID' }),
    webhookUrl: cliparse.argument('url', { description: 'Webhook URL' }),
    envVariableName: cliparse.argument('variable-name', { description: 'Name of the environment variable' }),
    envVariableNames: cliparse.argument('variable-names', {
      description: 'Comma separated list of names of the environment variables',
      parser: commaSeparated,
    }),
    envVariableValue: cliparse.argument('variable-value', { description: 'Value of the environment variable' }),
    port: cliparse.argument('port', {
      description: 'port identifying the TCP redirection',
      parser: integer,
    }),
    configurationName: cliparse.argument('configuration-name', {
      description: 'The name of the configuration to manage',
      complete () {
        return cliparse.autocomplete.words(listAvailableIds());
      },
    }),
    configurationValue: cliparse.argument('configuration-value', { description: 'The new value of the configuration' }),
    ngId: cliparse.argument('ng-id', { description: 'The Network Group id' }),
    ngIdOrLabel: cliparse.argument('ng', {
      description: 'Network Group ID or label',
      parser: ngIdOrLabel,
    }),
  };

  // OPTIONS
  const opts = {
    sourceableEnvVarsList: cliparse.flag('add-export', { description: 'Display sourceable env variables setting' }),
    accesslogsFormat: getOutputFormatOption(['simple', 'extended', 'clf']),
    addonEnvFormat: getOutputFormatOption(['shell']),
    accesslogsFollow: cliparse.flag('follow', {
      aliases: ['f'],
      description: 'Display access logs continuously (ignores before/until, after/since)',
    }),
    importAsJson: cliparse.flag('json', {
      description: 'Import variables as JSON (an array of { "name": "THE_NAME", "value": "the value" } objects)',
    }),
    addonId: cliparse.option('addon', { metavar: 'addon_id', description: 'Addon ID' }),
    after: cliparse.option('after', {
      metavar: 'after',
      aliases: ['since'],
      parser: date,
      description: 'Fetch logs after this date (ISO8601)',
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
      complete: listAvailableAliases,
    }),
    naturalName: cliparse.flag('natural-name', {
      aliases: ['n'],
      description: 'Show application names or aliases if possible',
    }),
    before: cliparse.option('before', {
      metavar: 'before',
      aliases: ['until'],
      parser: date,
      description: 'Fetch logs before this date (ISO8601)',
    }),
    branch: cliparse.option('branch', {
      aliases: ['b'],
      default: '',
      metavar: 'branch',
      description: 'Branch to push (current branch by default)',
      complete () {
        return completeBranches();
      },
    }),
    commit: cliparse.option('commit', {
      metavar: 'commit id',
      description: 'Restart the application with a specific commit id',
    }),
    databaseId: cliparse.option('database-id', {
      metavar: 'database_id',
      description: 'The Database ID (postgresql_xxx)',
    }),
    deploymentId: cliparse.option('deployment-id', {
      metavar: 'deployment_id',
      description: 'Fetch logs for a given deployment',
    }),
    namespace: cliparse.option('namespace', {
      metavar: 'namespace',
      description: 'namespace in which the TCP redirection should be',
      required: true,
      complete: completeNamespaces,
    }),
    notificationEventType: cliparse.option('event', {
      metavar: 'type',
      description: 'Restrict notifications to specific event types',
      complete: listMetaEvents,
      parser: commaSeparated,
    }),
    flavor: cliparse.option('flavor', {
      metavar: 'flavor',
      parser: flavor,
      description: 'The scale of your application',
      complete () {
        return cliparse.autocomplete.words(listAvailableFlavors());
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
    webhookFormat: cliparse.option('format', {
      metavar: 'format',
      default: 'raw',
      description: 'Format of the body sent to the webhook (\'raw\', \'slack\', \'gitter\', or \'flowdock\')',
    }),
    github: cliparse.option('github', {
      metavar: 'OWNER/REPO',
      description: 'Github application to use for deployments',
    }),
    sshIdentityFile: cliparse.option('identity-file', {
      aliases: ['i'],
      metavar: 'identity-file',
      description: 'SSH Identity file',
    }),
    instances: cliparse.option('instances', {
      metavar: 'instances',
      parser: instances,
      description: 'The number of parallels instances',
    }),
    linkAddon: cliparse.option('link', {
      aliases: ['l'],
      metavar: 'alias',
      description: 'Link the created addon to the app with the specified alias',
      complete: listAvailableAliases,
    }),
    listAllNotifications: cliparse.flag('list-all', { description: 'List all notifications for your user or for an organisation with the `--org` option' }),
    maxFlavor: cliparse.option('max-flavor', {
      metavar: 'maxflavor',
      parser: flavor,
      description: 'The maximum scale for your application',
      complete () {
        return cliparse.autocomplete.words(listAvailableFlavors());
      },
    }),
    buildFlavor: cliparse.option('build-flavor', {
      metavar: 'buildflavor',
      parser: buildFlavor,
      description: 'The size of the build instance, or `disabled` if you want to disable dedicated build instances',
    }),
    maxInstances: cliparse.option('max-instances', {
      metavar: 'maxinstances',
      parser: instances,
      description: 'The maximum number of parallels instances',
    }),
    minFlavor: cliparse.option('min-flavor', {
      metavar: 'minflavor',
      parser: flavor,
      description: 'The minimum scale for your application',
      complete () {
        return cliparse.autocomplete.words(listAvailableFlavors());
      },
    }),
    minInstances: cliparse.option('min-instances', {
      metavar: 'mininstances',
      parser: instances,
      description: 'The minimum number of parallels instances',
    }),
    noUpdateNotifier: cliparse.flag('no-update-notifier', { description: 'Don\'t notify available updates for clever-tools' }),
    emailNotificationTarget: cliparse.option('notify', {
      metavar: '<email_address>|<user_id>|"organisation"',
      description: 'Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)',
      required: true,
      parser: commaSeparated,
    }),
    onlyAddons: cliparse.flag('only-addons', { description: 'Only show addon dependencies' }),
    onlyAliases: cliparse.flag('only-aliases', { description: 'List only application aliases' }),
    onlyApps: cliparse.flag('only-apps', { description: 'Only show app dependencies' }),
    orgaIdOrName: cliparse.option('org', {
      aliases: ['o', 'owner'],
      description: 'Organisation ID (or name, if unambiguous)',
      parser: orgaIdOrName,
    }),
    output: cliparse.option('output', {
      aliases: ['out'],
      description: 'redirect the output of the command in a file',
    }),
    drainPassword: cliparse.option('password', {
      aliases: ['p'],
      metavar: 'password',
      description: 'HTTP basic auth password',
    }),
    addonPlan: cliparse.option('plan', {
      aliases: ['p'],
      default: 'dev',
      metavar: 'plan',
      description: 'Addon plan, depends on the provider',
      complete: completePlan,
    }),
    quiet: cliparse.flag('quiet', { aliases: ['q'], description: 'Don\'t show logs during deployment' }),
    followDeployLogs: cliparse.flag('follow', {
      description: 'Continue to follow logs after deployment has ended',
    }),
    addonRegion: cliparse.option('region', {
      aliases: ['r'],
      default: 'par',
      metavar: 'region',
      description: 'Region to provision the addon in, depends on the provider',
      complete: completeRegion,
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
      description: 'Region, can be \'par\' for Paris or \'mtl\' for Montreal',
      complete: listAvailableZones,
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
      description: 'Restrict notifications to specific applications and addons',
      parser: commaSeparated,
    }),
    showAllActivity: cliparse.flag('show-all', { description: 'Show all activity' }),
    showAll: cliparse.flag('show-all', { description: 'Show all available dependencies' }),
    loginToken: cliparse.option('token', {
      metavar: 'token',
      description: 'Directly give an existing token',
    }),
    instanceType: cliparse.option('type', {
      aliases: ['t'],
      required: true,
      metavar: 'type',
      description: 'Instance type',
      complete: listAvailableTypes,
    }),
    drainUsername: cliparse.option('username', {
      aliases: ['u'],
      metavar: 'username',
      description: 'HTTP basic auth username',
    }),
    drainAPIKey: cliparse.option('api-key', {
      aliases: ['k'],
      metavar: 'api_key',
      description: 'Drain custom key',
    }),
    verbose: cliparse.flag('verbose', { aliases: ['v'], description: 'Verbose output' }),
    withoutCache: cliparse.flag('without-cache', { description: 'Restart the application without using cache' }),
    confirmAddonCreation: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation even if the addon is not free',
    }),
    confirmAddonDeletion: cliparse.flag('yes', {
      aliases: ['y'],
      description: 'Skip confirmation and delete the addon directly',
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
      description: 'Network Group label, also used for dns context',
    }),
    ngIdOrLabel: cliparse.option('ng', {
      required: true,
      metavar: 'ng',
      description: 'Network Group ID or label',
      parser: ngIdOrLabel,
      // complete: NetworkGroup.xxx,
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
      description: `The member ID: an app ID (i.e. ${formatCode('app_xxx')}), add-on ID (i.e. ${formatCode('addon_xxx')}) or external node category ID`,
      // complete: NetworkGroup.xxx,
    }),
    ngMemberDomainName: cliparse.option('domain-name', {
      required: true,
      metavar: 'domain_name',
      description: `Member name used in the ${formatUrl('<memberName>.m.<ngID>.ng.clever-cloud.com', false)} domain name alias`,
    }),
    ngPeerId: cliparse.option('peer-id', {
      required: true,
      metavar: 'peer_id',
      description: 'The peer ID',
      // complete: NetworkGroup.xxx,
    }),
    ngPeerRole: cliparse.option('role', {
      required: true,
      metavar: 'peer_role',
      description: `The peer role, (${formatString('client')} or ${formatString('server')})`,
      parser: ngPeerRole,
      complete: listAvailablePeerRoles,
    }),
    // FIXME: Add "internal" member type
    // ngMemberType: cliparse.option('type', {
    //   required: true,
    //   metavar: 'member_type',
    //   description: `The member type (${Formatter.formatString('application')}, ${Formatter.formatString('addon')} or ${Formatter.formatString('external')})`,
    //   parser: Parsers.ngMemberType,
    //   complete: NetworkGroup.listAvailableMemberTypes,
    // }),
    // ngMemberLabel: cliparse.option('label', {
    //   required: true,
    //   metavar: 'member_label',
    //   description: 'Network Group member label',
    // }),
    // ngNodeCategoryId: cliparse.option('node-category-id', {
    //   required: true,
    //   aliases: ['c'],
    //   metavar: 'node_category_id',
    //   description: 'The external node category ID',
    //   // complete: NetworkGroup.xxx,
    // }),
    ngPeerLabel: cliparse.option('label', {
      required: true,
      metavar: 'peer_label',
      description: 'Network Group peer label',
    }),
    ngPeerParentMemberId: cliparse.option('parent', {
      required: true,
      metavar: 'member_id',
      description: 'Network Group peer category ID (parent member ID)',
      // complete: NetworkGroup.xxx,
    }),
    optNgIdOrLabel: cliparse.option('ng', {
      required: false,
      metavar: 'ng',
      description: 'Network Group ID or label',
      parser: ngIdOrLabel,
      // complete: NetworkGroup.xxx,
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
      // complete: NetworkGroup.xxx,
    }),
    optNgPeerId: cliparse.option('peer-id', {
      required: false,
      metavar: 'peer_id',
      description: 'The peer ID',
      // complete: NetworkGroup.xxx,
    }),
    // optNgPeerRole: cliparse.option('role', {
    //   required: false,
    //   default: 'client',
    //   metavar: 'peer_role',
    //   description: `The peer role, (${Formatter.formatString('client')} or ${Formatter.formatString('server')})`,
    //   parser: Parsers.ngPeerRole,
    //   complete: NetworkGroup.listAvailablePeerRoles,
    // }),
    optNgSearchAppId: cliparse.option('app-id', {
      required: false,
      metavar: 'app_id',
      description: 'The app id to search',
      // complete: NetworkGroup.xxx,
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
    tag: cliparse.option('tag', {
      required: true,
      metavar: 'tag',
      description: 'A tag',
      parser: tag,
    }),
    tags: cliparse.option('tags', {
      required: true,
      metavar: 'tags',
      description: 'List of tags separated by a comma',
      parser: tags,
    }),
    optTags: cliparse.option('tags', {
      metavar: 'tags',
      description: 'List of tags separated by a comma',
      parser: tags,
    }),
    optIpAddress: cliparse.option('ip', {
      required: false,
      metavar: 'ip_address',
      description: 'An IP address',
      parser: ipAddress,
    }),
    optPortNumber: cliparse.option('port', {
      required: false,
      metavar: 'port_number',
      description: 'A port number',
      parser: portNumber,
    }),
  };

  // ACCESSLOGS COMMAND
  const accesslogsCommand = cliparse.command('accesslogs', {
    description: 'Fetch access logs',
    options: [opts.alias, opts.accesslogsFormat, opts.before, opts.after, opts.accesslogsFollow, opts.addonId],
  }, accessLogs);

  // ACTIVITY COMMAND
  const activityCommand = cliparse.command('activity', {
    description: 'Show last deployments of a Clever Cloud application',
    options: [opts.alias, opts.follow, opts.showAllActivity],
  }, activity);

  // ADDON COMMANDS
  const addonCreateCommand = cliparse.command('create', {
    description: 'Create an addon',
    args: [args.addonProvider, args.addonName],
    options: [opts.linkAddon, opts.confirmAddonCreation, opts.addonPlan, opts.addonRegion, opts.addonVersion, opts.addonOptions],
  }, create$2);
  const addonDeleteCommand = cliparse.command('delete', {
    description: 'Delete an addon',
    args: [args.addonIdOrName],
    options: [opts.confirmAddonDeletion],
  }, deleteAddon);
  const addonRenameCommand = cliparse.command('rename', {
    description: 'Rename an addon',
    args: [args.addonIdOrName, args.addonName],
  }, rename);
  const addonShowProviderCommand = cliparse.command('show', {
    description: 'Show information about an addon provider',
    args: [args.addonProvider],
  }, showProvider);
  const addonProvidersCommand = cliparse.command('providers', {
    description: 'List available addon providers',
    commands: [addonShowProviderCommand],
  }, listProviders);
  const addonEnvCommand = cliparse.command('env', {
    description: 'List the environment variables for an add-on',
    options: [opts.addonEnvFormat],
    args: [opts.addonId],
  }, env);

  const addonCommands = cliparse.command('addon', {
    description: 'Manage addons',
    options: [opts.orgaIdOrName],
    commands: [addonCreateCommand, addonDeleteCommand, addonRenameCommand, addonProvidersCommand, addonEnvCommand],
  }, list$9);

  // APPLICATIONS COMMAND
  const applicationsCommand = cliparse.command('applications', {
    description: 'List linked applications',
    options: [opts.onlyAliases, opts.jsonFormat],
  }, list$8);

  // CANCEL DEPLOY COMMAND
  const cancelDeployCommand = cliparse.command('cancel-deploy', {
    description: 'Cancel an ongoing deployment on Clever Cloud',
    options: [opts.alias],
  }, cancelDeploy);

  // CONFIG COMMAND
  const configGetCommand = cliparse.command('get', {
    description: 'Display the current configuration',
    args: [args.configurationName],
  }, get);
  const configSetCommand = cliparse.command('set', {
    description: 'Edit one configuration setting',
    args: [args.configurationName, args.configurationValue],
  }, set$2);
  const configUpdateCommand = cliparse.command('update', {
    description: 'Edit multiple configuration settings at once',
    options: getUpdateOptions(),
  }, update);
  const configCommands = cliparse.command('config', {
    description: 'Display or edit the configuration of your application',
    options: [opts.alias],
    commands: [configGetCommand, configSetCommand, configUpdateCommand],
  }, get);

  // CREATE COMMAND
  const appCreateCommand = cliparse.command('create', {
    description: 'Create a Clever Cloud application',
    args: [args.appNameCreation],
    options: [opts.instanceType, opts.orgaIdOrName, opts.aliasCreation, opts.region, opts.github],
  }, create$1);

  // DELETE COMMAND
  const deleteCommand = cliparse.command('delete', {
    description: 'Delete a Clever Cloud application',
    options: [opts.alias, opts.confirmApplicationDeletion],
  }, deleteApp);

  // DEPLOY COMMAND
  const deployCommand = cliparse.command('deploy', {
    description: 'Deploy an application to Clever Cloud',
    options: [opts.alias, opts.branch, opts.quiet, opts.forceDeploy, opts.followDeployLogs],
  }, deploy);

  // DIAG COMMAND
  const diagCommand = cliparse.command('diag', {
    description: 'Diagnose the current installation (prints various informations for support)',
    args: [],
  }, diag);

  // DOMAIN COMMANDS
  const domainCreateCommand = cliparse.command('add', {
    description: 'Add a domain name to a Clever Cloud application',
    args: [args.fqdn],
  }, add$3);
  const domainRemoveCommand = cliparse.command('rm', {
    description: 'Remove a domain name from a Clever Cloud application',
    args: [args.fqdn],
  }, rm$3);
  const domainSetFavouriteCommand = cliparse.command('set', {
    description: 'Set the favourite domain for a Clever Cloud application',
    args: [args.fqdn],
  }, setFavourite);
  const domainUnsetFavouriteCommand = cliparse.command('unset', {
    description: 'Unset the favourite domain for a Clever Cloud application',
  }, unsetFavourite);
  const domainFavouriteCommands = cliparse.command('favourite', {
    description: 'Manage Clever Cloud application favourite domain name',
    commands: [domainSetFavouriteCommand, domainUnsetFavouriteCommand],
  }, getFavourite);
  const domainCommands = cliparse.command('domain', {
    description: 'Manage Clever Cloud application domain names',
    options: [opts.alias],
    commands: [domainCreateCommand, domainFavouriteCommands, domainRemoveCommand],
  }, list$7);

  // DRAIN COMMANDS
  const drainCreateCommand = cliparse.command('create', {
    description: 'Create a drain',
    args: [args.drainType, args.drainUrl],
    options: [opts.addonId, opts.drainUsername, opts.drainPassword, opts.drainAPIKey],
  }, create);
  const drainRemoveCommand = cliparse.command('remove', {
    description: 'Remove a drain',
    args: [args.drainId],
  }, rm$2);
  const drainEnableCommand = cliparse.command('enable', {
    description: 'Enable a drain',
    args: [args.drainId],
  }, enable);
  const drainDisableCommand = cliparse.command('disable', {
    description: 'Disable a drain',
    args: [args.drainId],
  }, disable);
  const drainCommands = cliparse.command('drain', {
    description: 'Manage drains',
    options: [opts.alias, opts.addonId],
    commands: [drainCreateCommand, drainRemoveCommand, drainEnableCommand, drainDisableCommand],
  }, list$6);

  // ENV COMMANDS
  const envSetCommand = cliparse.command('set', {
    description: 'Add or update an environment variable named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, set$1);
  const envRemoveCommand = cliparse.command('rm', {
    description: 'Remove an environment variable from a Clever Cloud application',
    args: [args.envVariableName],
  }, rm$1);
  const envImportCommand = cliparse.command('import', {
    description: 'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, importEnv$1);
  const envImportVarsFromLocalEnvCommand = cliparse.command('import-vars', {
    description: 'Add or update environment variables named <variable-names> (comma separated), taking their values from the current environment',
    args: [args.envVariableNames],
  }, importVarsFromLocalEnv);
  const envCommands = cliparse.command('env', {
    description: 'Manage Clever Cloud application environment',
    options: [opts.alias, opts.sourceableEnvVarsList],
    commands: [envSetCommand, envRemoveCommand, envImportCommand, envImportVarsFromLocalEnvCommand],
  }, list$5);

  // LINK COMMAND
  const appLinkCommand = cliparse.command('link', {
    description: 'Link this repo to an existing Clever Cloud application',
    args: [args.appIdOrName],
    options: [opts.aliasCreation, opts.orgaIdOrName],
  }, link);

  // LOGIN COMMAND
  const loginCommand = cliparse.command('login', {
    description: 'Login to Clever Cloud',
    options: [opts.loginToken, opts.loginSecret],
  }, login);

  // LOGOUT COMMAND
  const logoutCommand = cliparse.command('logout', {
    description: 'Logout from Clever Cloud',
  }, logout);

  // LOGS COMMAND
  const logsCommand = cliparse.command('logs', {
    description: 'Fetch application logs, continuously',
    options: [opts.alias, opts.before, opts.after, opts.search, opts.deploymentId, opts.addonId],
  }, appLogs);

  // MAKE DEFAULT COMMAND
  const makeDefaultCommand = cliparse.command('make-default', {
    description: 'Make a linked application the default one',
    args: [args.alias],
  }, makeDefault);

  // NETWORK GROUPS COMMANDS

  // network group category - start
  // const networkGroupsListCommand = cliparse.command('list', {
  //   description: 'List Network Groups with their labels',
  //   options: [opts.jsonFormat],
  // }, networkgroups.listNetworkGroups);
  // const networkGroupsCreateCommand = cliparse.command('create', {
  //   description: 'Create a Network Group',
  //   options: [opts.ngLabel, opts.ngDescription, opts.optTags, opts.jsonFormat],
  // }, networkgroups.createNg);
  // const networkGroupsDeleteCommand = cliparse.command('delete', {
  //   description: 'Delete a Network Group',
  //   options: [opts.ngIdOrLabel],
  // }, networkgroups.deleteNg);
  // // network group category - end

  // // member category - start
  // const networkGroupsMemberListCommand = cliparse.command('list', {
  //   description: 'List members of a Network Group',
  //   // Add option opts.optNgSearchAppId ?
  //   options: [opts.ngIdOrLabel, opts.naturalName, opts.jsonFormat],
  // }, networkgroups.listMembers);
  // const networkGroupsMemberGetCommand = cliparse.command('get', {
  //   description: 'Get a Network Group member details',
  //   options: [opts.ngIdOrLabel, opts.ngMemberId, opts.naturalName, opts.jsonFormat],
  // }, networkgroups.getMember);
  // const networkGroupsMemberAddCommand = cliparse.command('add', {
  //   description: 'Add an app or addon as a Network Group member',
  //   options: [opts.ngIdOrLabel, opts.ngMemberId, opts.ngMemberType, opts.ngMemberDomainName, opts.optNgMemberLabel],
  // }, networkgroups.addMember);
  // const networkGroupsMemberRemoveCommand = cliparse.command('remove', {
  //   description: 'Remove an app or addon from a Network Group',
  //   options: [opts.ngIdOrLabel, opts.ngMemberId],
  // }, networkgroups.removeMember);
  //
  // const networkGroupsMembersCategoryCommand = cliparse.command('members', {
  //   description: 'List commands for interacting with Network Group members',
  //   commands: [networkGroupsMemberListCommand, networkGroupsMemberGetCommand, networkGroupsMemberAddCommand, networkGroupsMemberRemoveCommand],
  // });
  // // member category - end

  // // peer category - start
  // const networkGroupsPeerListCommand = cliparse.command('list', {
  //   description: 'List peers of a Network Group',
  //   options: [opts.ngIdOrLabel, opts.jsonFormat],
  // }, networkgroups.listPeers);
  // const networkGroupsPeerGetCommand = cliparse.command('get', {
  //   description: 'Get a Network Group peer details',
  //   options: [opts.ngIdOrLabel, opts.ngPeerId, opts.jsonFormat],
  // }, networkgroups.getPeer);
  // const networkGroupsPeerAddCommand = cliparse.command('add-external', {
  //   description: 'Add an external node as a Network Group peer',
  //   options: [opts.ngIdOrLabel, opts.ngPeerRole, opts.wgPublicKey, opts.ngPeerLabel, opts.ngPeerParentMemberId],
  // }, networkgroups.addExternalPeer);
  // const networkGroupsPeerRemoveExternalCommand = cliparse.command('remove-external', {
  //   description: 'Remove an external node from a Network Group',
  //   options: [opts.ngIdOrLabel, opts.ngPeerId],
  // }, networkgroups.removeExternalPeer);

  // const networkGroupsPeersCategoryCommand = cliparse.command('peers', {
  //   description: 'List commands for interacting with Network Group peers',
  //   commands: [networkGroupsPeerListCommand, networkGroupsPeerGetCommand, networkGroupsPeerAddCommand, networkGroupsPeerRemoveExternalCommand],
  // });
  // peer category - end

  // const networkGroupsCommand = cliparse.command('networkgroups', {
  //   description: 'List Network Group commands',
  //   options: [opts.orgaIdOrName, opts.alias],
  //   commands: [networkGroupsListCommand, networkGroupsCreateCommand, networkGroupsDeleteCommand, networkGroupsMembersCategoryCommand, networkGroupsPeersCategoryCommand],
  // });
  // const ngCommand = cliparse.command('ng', {
  //   description: `Alias for ${Formatter.formatCommand('clever networkgroups')}`,
  //   options: [opts.orgaIdOrName, opts.alias],
  //   commands: [networkGroupsListCommand, networkGroupsCreateCommand, networkGroupsDeleteCommand, networkGroupsMembersCategoryCommand, networkGroupsPeersCategoryCommand],
  // });

  // NOTIFY-EMAIL COMMAND
  const addEmailNotificationCommand = cliparse.command('add', {
    description: 'Add a new email notification',
    options: [opts.notificationEventType, opts.notificationScope, opts.emailNotificationTarget],
    args: [args.notificationName],
  }, add$2);
  const removeEmailNotificationCommand = cliparse.command('remove', {
    description: 'Remove an existing email notification',
    args: [args.notificationId],
  }, remove$2);
  const emailNotificationsCommand = cliparse.command('notify-email', {
    description: 'Manage email notifications',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    commands: [addEmailNotificationCommand, removeEmailNotificationCommand],
  }, list$4);

  // OPEN COMMAND
  const openCommand = cliparse.command('open', {
    description: 'Open an application in the browser',
    options: [opts.alias],
  }, open);

  // CONSOLE COMMAND
  const consoleCommand = cliparse.command('console', {
    description: 'Open an application in the console',
    options: [opts.alias],
  }, openConsole);

  // PROFILE COMMAND
  const profileCommand = cliparse.command('profile', {
    description: 'Display the profile of the current user',
  }, profile);

  // PUBLISHED CONFIG COMMANDS
  const publishedConfigSetCommand = cliparse.command('set', {
    description: 'Add or update a published configuration item named <variable-name> with the value <variable-value>',
    args: [args.envVariableName, args.envVariableValue],
  }, set);
  const publishedConfigRemoveCommand = cliparse.command('rm', {
    description: 'Remove a published configuration variable from a Clever Cloud application',
    args: [args.envVariableName],
  }, rm);
  const publishedConfigImportCommand = cliparse.command('import', {
    description: 'Load published configuration from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
    options: [opts.importAsJson],
  }, importEnv);
  const publishedConfigCommands = cliparse.command('published-config', {
    description: 'Manage the configuration made available to other applications by this application',
    options: [opts.alias],
    commands: [publishedConfigSetCommand, publishedConfigRemoveCommand, publishedConfigImportCommand],
  }, list$3);

  // RESTART COMMAND
  const restartCommand = cliparse.command('restart', {
    description: 'Start or restart a Clever Cloud application',
    options: [opts.alias, opts.commit, opts.withoutCache, opts.quiet, opts.followDeployLogs],
  }, restart);

  // SCALE COMMAND
  const scaleCommand = cliparse.command('scale', {
    description: 'Change scalability of an application',
    options: [opts.alias, opts.flavor, opts.minFlavor, opts.maxFlavor, opts.instances, opts.minInstances, opts.maxInstances, opts.buildFlavor],
  }, scale);

  // SERVICE COMMANDS
  const serviceLinkAppCommand = cliparse.command('link-app', {
    description: 'Add an existing app as a dependency',
    args: [args.appIdOrName],
  }, linkApp);
  const serviceUnlinkAppCommand = cliparse.command('unlink-app', {
    description: 'Remove an app from the dependencies',
    args: [args.appIdOrName],
  }, unlinkApp);
  const serviceLinkAddonCommand = cliparse.command('link-addon', {
    description: 'Link an existing addon to this application',
    args: [args.addonIdOrName],
  }, linkAddon);
  const serviceUnlinkAddonCommand = cliparse.command('unlink-addon', {
    description: 'Unlink an addon from this application',
    args: [args.addonIdOrName],
  }, unlinkAddon);
  const serviceCommands = cliparse.command('service', {
    description: 'Manage service dependencies',
    options: [opts.alias, opts.onlyApps, opts.onlyAddons, opts.showAll],
    commands: [serviceLinkAppCommand, serviceUnlinkAppCommand, serviceLinkAddonCommand, serviceUnlinkAddonCommand],
  }, list$2);

  // SSH COMMAND
  const sshCommand = cliparse.command('ssh', {
    description: 'Connect to running instances through SSH',
    options: [opts.alias, opts.sshIdentityFile],
  }, ssh);

  // STATUS COMMAND
  const statusCommand = cliparse.command('status', {
    description: 'See the status of an application on Clever Cloud',
    options: [opts.alias],
  }, status);

  // STOP COMMAND
  const stopCommand = cliparse.command('stop', {
    description: 'Stop a running application on Clever Cloud',
    options: [opts.alias],
  }, stop);

  // TCP-REDIRS COMMAND
  const tcpRedirsListNamespacesCommand = cliparse.command('list-namespaces', {
    description: 'List the namespaces in which you can create new TCP redirections',
  }, listNamespaces);
  const tcpRedirsAddCommand = cliparse.command('add', {
    description: 'Add a new TCP redirection to the application',
    options: [opts.namespace, opts.confirmTcpRedirCreation],
  }, add$1);
  const tcpRedirsRemoveCommand = cliparse.command('remove', {
    description: 'Remove a TCP redirection from the application',
    options: [opts.namespace],
    args: [args.port],
  }, remove$1);
  const tcpRedirsCommands = cliparse.command('tcp-redirs', {
    description: 'Control the TCP redirections from reverse proxies to your application',
    options: [opts.alias],
    commands: [tcpRedirsListNamespacesCommand, tcpRedirsAddCommand, tcpRedirsRemoveCommand],
  }, list$1);

  // UNLINK COMMAND
  const appUnlinkCommand = cliparse.command('unlink', {
    description: 'Unlink this repo from an existing Clever Cloud application',
    args: [args.alias],
  }, unlink);

  // VERSION COMMAND
  const versionCommand = cliparse.command('version', {
    description: 'Display the version',
    args: [],
  }, version);

  // WEBHOOKS COMMAND
  const addWebhookCommand = cliparse.command('add', {
    description: 'Register webhook to be called when events happen',
    options: [opts.webhookFormat, opts.notificationEventType, opts.notificationScope],
    args: [args.notificationName, args.webhookUrl],
  }, add);
  const removeWebhookCommand = cliparse.command('remove', {
    description: 'Remove an existing webhook',
    args: [args.notificationId],
  }, remove);
  const webhooksCommand = cliparse.command('webhooks', {
    description: 'Manage webhooks',
    options: [opts.orgaIdOrName, opts.listAllNotifications],
    commands: [addWebhookCommand, removeWebhookCommand],
  }, list);

  // DATABASES COMMANDS
  const downloadBackupCommand = cliparse.command('download', {
    description: 'Download a database backup',
    args: [args.databaseId, args.backupId],
    options: [opts.output],
  }, downloadBackups);
  const backupsCommand = cliparse.command('backups', {
    description: 'List available database backups',
    args: [args.databaseId],
    options: [opts.orgaIdOrName],
    commands: [
      downloadBackupCommand,
    ],
  }, listBackups);
  const databaseCommand = cliparse.command('database', {
    description: 'List available databases',
    commands: [backupsCommand],
  }, () => {
    console.info('This command is not available, you can try the following commands:');
    console.info('clever database backups');
    console.info('clever database backups download');
  });

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
    description: 'CLI tool to manage Clever Cloud data and products',
    version: pkg$1.version,
    options: [opts.verbose, opts.noUpdateNotifier],
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
  curl();
}
else {
  run();
}
