'use strict';

const { promises: fs } = require('fs');
const path = require('path');

const commonEnv = require('common-env');
const mkdirp = require('mkdirp');
const xdg = require('xdg');

const Logger = require('../logger.js');
const env = commonEnv(Logger);

function getConfigDir () {
  if (process.platform === 'win32') {
    return path.resolve(process.env.APPDATA, 'clever-cloud');
  }
  else {
    return xdg.basedir.configPath('clever-cloud');
  }
}

function getConfigPath () {
  const configDir = getConfigDir();
  return path.resolve(configDir, 'clever-tools.json');
}

async function maybeMigrateFromLegacyConfigurationPath () {
  // This used to be a file
  const configDir = getConfigDir();
  const configDirStat = await fs.stat(configDir);
  // If it is still a file, we replace it with a dir and move it inside
  if (configDirStat.isFile()) {
    const tmpConfigFile = `${configDir}.tmp`;
    const configFile = getConfigPath();

    // Rename so that we can create the directory
    await fs.rename(configDir, tmpConfigFile);
    await mkdirp(configDir, { mode: 0o700 });
    await fs.rename(tmpConfigFile, configFile);
  }
}

async function loadOAuthConf () {
  Logger.debug('Load configuration from environment variables');
  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    return {
      token: process.env.CLEVER_TOKEN,
      secret: process.env.CLEVER_SECRET,
    };
  }
  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  await maybeMigrateFromLegacyConfigurationPath();
  try {
    const rawFile = await fs.readFile(conf.CONFIGURATION_FILE);
    return JSON.parse(rawFile);
  }
  catch (error) {
    Logger.info(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`);
    return {};
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

const conf = env.getOrElseAll({
  API_HOST: 'https://api.clever-cloud.com',
  // API_HOST: 'https://ccapi-preprod.cleverapps.io',
  LOG_WS_URL: 'wss://api.clever-cloud.com/v2/logs/logs-socket/<%- appId %>?since=<%- timestamp %>',
  LOG_HTTP_URL: 'https://api.clever-cloud.com/v2/logs/<%- appId %>',
  EVENT_URL: 'wss://api.clever-cloud.com/v2/events/event-socket',
  WARP_10_EXEC_URL: 'https://c1-warp10-clevercloud-customers.services.clever-cloud.com/api/v0/exec',
  OAUTH_CONSUMER_KEY: 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e',
  OAUTH_CONSUMER_SECRET: 'MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT',
  SSH_GATEWAY: 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com',

  CONFIGURATION_FILE: getConfigPath(),
  CONSOLE_TOKEN_URL: 'https://console.clever-cloud.com/cli-oauth',
  // CONSOLE_TOKEN_URL: 'https://next-console.cleverapps.io/cli-oauth',

  CLEVER_CONFIGURATION_DIR: path.resolve('.', 'clevercloud'),
  APP_CONFIGURATION_FILE: path.resolve('.', '.clever.json'),
});

module.exports = { conf, loadOAuthConf, writeOAuthConf };
