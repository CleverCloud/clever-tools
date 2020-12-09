'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function list (params) {
  const { 'only-aliases': onlyAliases, json } = params.options;

  const { apps } = await AppConfig.loadApplicationConf();

  const formattedApps = formatApps(apps, onlyAliases, json);
  Logger.println(formattedApps);
};

function formatApps (apps, onlyAliases, json) {

  if (json) {
    if (onlyAliases) {
      apps = apps.map((a) => a.alias);
    }
    return JSON.stringify(apps, null, 2);
  }
  else {
    if (onlyAliases) {
      return apps.map((a) => a.alias).join('\n');
    }
    else {
      return apps
        .map((app) =>
          [
            `Application ${app.name}`,
            `  alias: ${colors.bold(app.alias)}`,
            `  id: ${app.app_id}`,
            `  deployment url: ${app.deploy_url}`].join('\n'),
        )
        .join('\n\n');
    }
  }
}

module.exports = { list };
