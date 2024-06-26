'use strict';

const Application = require('../models/application.js');
const Logger = require('../logger.js');
const openPage = require('open');

async function openConsole (params) {
  const { alias, app: appIdOrName } = params.options;

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  Logger.println('Opening the console in your browser');

  const prefixPath = (ownerId.startsWith('user_')) ? 'users/me' : `organisations/${ownerId}`;
  const url = `https://console.clever-cloud.com/${prefixPath}/applications/${appId}`;
  await openPage(url, { wait: false });
}

module.exports = { openConsole };
