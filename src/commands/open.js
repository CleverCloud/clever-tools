'use strict';

const openPage = require('opn');

const AppConfig = require('../models/app_configuration.js');
const Domain = require('../models/domain.js');
const Logger = require('../logger.js');

async function open (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const vhost = await Domain.getBest(appId, ownerId);
  const url = 'https://' + vhost.fqdn;

  Logger.println('Opening the application in your browser');
  await openPage(url, { wait: false });
}

module.exports = { open };
