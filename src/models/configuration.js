'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const commonEnv = require('common-env');
const mkdirp = require('mkdirp');
const xdg = require('xdg');

const Logger = require('../logger.js');
const env = commonEnv(Logger);

function getConfigPath () {
  if (process.platform === 'win32') {
    return path.resolve(process.env.APPDATA, 'clever-cloud');
  }
  else {
    return xdg.basedir.configPath('clever-cloud');
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
  try {
    const rawFile = await readFile(conf.CONFIGURATION_FILE);
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
    await writeFile(conf.CONFIGURATION_FILE, JSON.stringify(oauthData));
  }
  catch (error) {
    throw new Error(`Cannot write configuration to ${conf.CONFIGURATION_FILE}\n${error.message}`);
  }
}

const conf = env.getOrElseAll({
  API_HOST: 'https://api.clever-cloud.com',
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
