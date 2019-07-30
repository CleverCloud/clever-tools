'use strict';

const fs = require('fs');
const path = require('path');

const Bacon = require('baconjs');
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

function loadOAuthConf () {
  Logger.debug('Load configuration from environment variables');
  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    return Bacon
      .once({
        token: process.env.CLEVER_TOKEN,
        secret: process.env.CLEVER_SECRET,
      })
      .toProperty();
  }
  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  return Bacon.fromNodeCallback(fs.readFile, conf.CONFIGURATION_FILE)
    .flatMapLatest(Bacon.try(JSON.parse))
    .flatMapError((error) => {
      // TODO propagate this
      Logger.info(new Bacon.Error(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`));
      return {};
    });
}

function writeOAuthConf (oauthData) {
  Logger.debug('Write the tokens in the configuration file…');
  const configDir = path.dirname(conf.CONFIGURATION_FILE);
  return Bacon
    .fromNodeCallback(mkdirp, configDir, { mode: 0o700 })
    .flatMapLatest(() => {
      return Bacon.fromNodeCallback(fs.writeFile, conf.CONFIGURATION_FILE, JSON.stringify(oauthData));
    });
}

const conf = env.getOrElseAll({
  API_HOST: 'https://api.clever-cloud.com/v2',
  // API_HOST: 'https://ccapi-preprod.cleverapps.io/v2',
  LOG_WS_URL: 'wss://api.clever-cloud.com/v2/logs/logs-socket/<%- appId %>?since=<%- timestamp %>',
  LOG_HTTP_URL: 'https://api.clever-cloud.com/v2/logs/<%- appId %>',
  EVENT_URL: 'wss://api.clever-cloud.com/v2/events/event-socket',
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
