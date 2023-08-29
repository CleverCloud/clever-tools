'use strict';

const { promises: fs } = require('fs');
const path = require('path');

const commonEnv = require('common-env');
const mkdirp = require('mkdirp');
const xdg = require('xdg');

const Logger = require('../logger.js');
const env = commonEnv(Logger);

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
    const rawFile = await fs.readFile(conf.CONFIGURATION_FILE);
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
    await fs.writeFile(conf.CONFIGURATION_FILE, JSON.stringify(oauthData));
  }
  catch (error) {
    throw new Error(`Cannot write configuration to ${conf.CONFIGURATION_FILE}\n${error.message}`);
  }
}

async function loadIdsCache () {
  const cachePath = getConfigPath(CONFIG_FILES.IDS_CACHE);
  try {
    const rawFile = await fs.readFile(cachePath);
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
    await fs.writeFile(cachePath, idsJson);
  }
  catch (error) {
    throw new Error(`Cannot write IDs cache to ${cachePath}\n${error.message}`);
  }
}

const conf = env.getOrElseAll({
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

module.exports = { conf, loadOAuthConf, writeOAuthConf, loadIdsCache, writeIdsCache };
