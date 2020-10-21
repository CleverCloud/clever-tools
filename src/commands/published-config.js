'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const variables = require('../models/variables.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');
const application = require('@clevercloud/client/cjs/api/v2/application.js');

async function list (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  const pairs = Object.entries(publishedConfigs)
    .map(([name, value]) => ({ name, value }));

  Logger.println('# Published configs');
  Logger.println(toNameEqualsValueString(pairs));
};

async function set (params) {
  const [varName, varValue] = params.args;
  const { alias } = params.options;

  const nameIsValid = validateName(varName);
  if (!nameIsValid) {
    throw new Error(`Published config name ${varName} is invalid`);
  }

  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  publishedConfigs[varName] = varValue;
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully saved');
};

async function rm (params) {
  const [varName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const publishedConfigs = await application.getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  delete publishedConfigs[varName];
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully removed');
};

async function importEnv (params) {
  const { alias, json } = params.options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const publishedConfigs = await variables.readVariablesFromStdin(format);
  await application.updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published configs have been set');
};

module.exports = { list, set, rm, importEnv };
