'use strict';

const openPage = require('opn');

const AppConfig = require('../models/app_configuration.js');
const Domain = require('../models/domain.js');
const Logger = require('../logger.js');

async function open (params) {
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const vhost = await Domain.getBest(appId, org_id);
  const url = 'https://' + vhost.fqdn;

  Logger.println('Opening the application in your browser');
  await openPage(url, { wait: false });
}

module.exports = { open };
