'use strict';

const colors = require('colors');
const _ = require('lodash');

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function applications (api, params) {
  const { 'only-aliases': onlyAliases } = params.options;

  const s_result = AppConfig.loadApplicationConf()
    .map(({ apps }) => {
      if(onlyAliases) {
        return _.map(apps, 'alias').join('\n');
      }
      return _.map(apps, (app) => {
        return [
          `Application ${app.name}`,
          `  alias: ${colors.bold(app.alias)}`,
          `  id: ${app.app_id}`,
          `  deployment url: ${app.deploy_url}`].join('\n');
      }).join('\n\n');
    })
    .map(Logger.println);

  handleCommandStream(s_result);
};

module.exports = applications;
