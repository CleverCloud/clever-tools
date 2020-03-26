'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function list (params) {
  const { 'only-aliases': onlyAliases } = params.options;

  const { apps } = await AppConfig.loadApplicationConf().toPromise();

  const formattedApps = formatApps(apps, onlyAliases);
  Logger.println(formattedApps);
};

function formatApps (apps, onlyAliases) {

  if (onlyAliases) {
    return apps.map((a) => a.alis).join('\n');
  }

  return apps
    .map((app) => {
      return [
        `Application ${app.name}`,
        `  alias: ${colors.bold(app.alias)}`,
        `  id: ${app.app_id}`,
        `  deployment url: ${app.deploy_url}`].join('\n');
    })
    .join('\n\n');
}

module.exports = { list };
