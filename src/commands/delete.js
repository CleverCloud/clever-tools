'use strict';

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const Logger = require('../logger.js');

async function deleteApp (params) {
  const { alias, yes: skipConfirmation } = params.options;
  const appDetails = await AppConfig.getAppDetails({ alias });

  await Application.deleteApp(appDetails, skipConfirmation);
  await Application.unlinkRepo(appDetails.alias);

  Logger.println('The application has been deleted');
};

module.exports = { deleteApp };
