'use strict';

const application = require('@clevercloud/client/cjs/api/v2/application.js');

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

async function update (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const options = ApplicationConfiguration.parseOptions(params.options);

  if (Object.keys(options).length === 0) {
    throw new Error('No configuration to update');
  }

  const app = await application.update({ id: ownerId, appId }, options).then(sendToApi);

  for (const configName of Object.keys(options)) {
    ApplicationConfiguration.printByName(app, configName);
  }
}

module.exports = { get, set, update };
