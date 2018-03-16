'use strict';

const fs = require('fs');
const path = require('path');

const Bacon = require('baconjs');
const commonEnv = require('common-env');
const xdg = require('xdg');

const Logger = require('../logger.js');
const env = commonEnv(Logger);

function getConfigPath () {
  if (process.platform === 'win32') {
    return path.resolve(process.env.APPDATA, 'clever-cloud');
  } else {
    return xdg.basedir.configPath('clever-cloud');
  }
};

function loadOAuthConf () {
  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  return Bacon.fromNodeCallback(fs.readFile, conf.CONFIGURATION_FILE)
    .flatMapLatest(Bacon.try(JSON.parse))
    .flatMapError((error) => {
      // TODO propagate this
      Logger.info(new Bacon.Error(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`));
      return {};
    });
};

const conf = env.getOrElseAll({
  API_HOST: 'https://api.clever-cloud.com/v2',
  LOG_WS_URL: 'wss://api.clever-cloud.com/v2/logs/logs-socket/<%- appId %>?since=<%- timestamp %>',
  LOG_HTTP_URL: 'https://api.clever-cloud.com/v2/logs/<%- appId %>',
  EVENT_URL: 'wss://api.clever-cloud.com/v2/events/event-socket',
  OAUTH_CONSUMER_KEY: 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e',
  OAUTH_CONSUMER_SECRET: 'MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT',
  SSH_GATEWAY: 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com',

  CONFIGURATION_FILE: getConfigPath(),
  CONSOLE_TOKEN_URL: 'https://console.clever-cloud.com/cli-oauth',

  CLEVER_CONFIGURATION_DIR: path.resolve('.', 'clevercloud'),
  APP_CONFIGURATION_FILE: path.resolve('.', '.clever.json'),
});

module.exports = { conf, loadOAuthConf };
