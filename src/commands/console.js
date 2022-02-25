'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const openPage = require('open');

async function openConsole (params) {
  const { alias } = params.options;

  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  Logger.println('Opening the console in your browser');

  const prefixPath = (ownerId.startsWith('user_')) ? 'users/me' : `organisations/${ownerId}`;
  const url = `https://console.clever-cloud.com/${prefixPath}/applications/${appId}`;
  await openPage(url, { wait: false });
}

module.exports = { openConsole };
