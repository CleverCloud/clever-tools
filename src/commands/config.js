'use strict';

const application = require('@clevercloud/client/cjs/api/application.js');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const ApplicationConfiguration = require('../models/application_configuration.js');

const { sendToApi } = require('../models/send-to-api.js');

async function get (params) {
  const [configurationName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const app = await Application.get(ownerId, appId);

  if (configurationName == null) {
    ApplicationConfiguration.print(app);
  }
  else {
    ApplicationConfiguration.printById(app, configurationName);
  }
}

async function set (params) {
  const [configurationName, configurationValue] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const config = ApplicationConfiguration.getById(configurationName);

  if (config != null) {
    const app = await application.update({ id: ownerId, appId }, { [config.name]: ApplicationConfiguration.parse(config, configurationValue) }).then(sendToApi);

    ApplicationConfiguration.printById(app, configurationName);
  }
}

module.exports = { get, set };
