'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const variables = require('../models/variables.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');
const application = require('@clevercloud/client/cjs/api/application.js');

async function list (params) {
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const publishedConfigs = await application.getAllExposedEnvVars({ id: org_id, appId }).then(sendToApi);
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

  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const publishedConfigs = await application.getAllExposedEnvVars({ id: org_id, appId }).then(sendToApi);
  publishedConfigs[varName] = varValue;
  await application.updateAllExposedEnvVars({ id: org_id, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully saved');
};

async function rm (params) {
  const [varName] = params.args;
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const publishedConfigs = await application.getAllExposedEnvVars({ id: org_id, appId }).then(sendToApi);
  delete publishedConfigs[varName];
  await application.updateAllExposedEnvVars({ id: org_id, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully removed');
};

async function importEnv (params) {
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const publishedConfigs = await variables.readVariablesFromStdin();
  await application.updateAllExposedEnvVars({ id: org_id, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published configs have been set');
};

module.exports = { list, set, rm, importEnv };
