'use strict';

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const Logger = require('../logger.js');

async function unlink (params) {
  const [alias] = params.args;
  const app = await AppConfig.getAppDetails({ alias });

  await Application.unlinkRepo(app.alias).toPromise();
  Logger.println('Your application has been successfully unlinked!');
};

module.exports = { unlink };
