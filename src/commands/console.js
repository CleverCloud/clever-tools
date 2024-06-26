'use strict';

const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const openPage = require('open');

async function openConsole (params) {
  const { alias, app: appIdOrName } = params.options;

  const baseUrl = 'https://console.clever-cloud.com';

  const { apps } = await AppConfig.loadApplicationConf();
  // If no app is linked or asked, open the Console without any context
  if (apps.length === 0 && !appIdOrName) {
    Logger.println('Opening the Console in your browser');
    await openPage(baseUrl, { wait: false });
    return;
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const prefixPath = (ownerId.startsWith('user_')) ? 'users/me' : `organisations/${ownerId}`;
  const url = `${baseUrl}/${prefixPath}/applications/${appId}`;

  Logger.debug(`URL: ${url}`);
  Logger.println(`Opening the Console in your browser for application ${appId}`);

  await openPage(url, { wait: false });
}

module.exports = { openConsole };
