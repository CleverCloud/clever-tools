'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function makeDefault (params) {
  const [alias] = params.args;

  await AppConfig.setDefault(alias);

  Logger.println(`The application ${alias} has been set as default`);
};

module.exports = { makeDefault };
