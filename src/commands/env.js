'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const variables = require('../models/variables.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');
const application = require('@clevercloud/client/cjs/api/application.js');

async function list (params) {
  const { alias, 'add-export': addExports } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
    application.getAllEnvVars({ id: org_id, appId }).then(sendToApi),
    application.getAllEnvVarsForAddons({ id: org_id, appId }).then(sendToApi),
    application.getAllEnvVarsForDependencies({ id: org_id, appId }).then(sendToApi),
  ]);

  Logger.println('# Manually set env variables');
  Logger.println(toNameEqualsValueString(envFromApp, { addExports }));

  envFromAddons.forEach((addon) => {
    Logger.println('# Addon ' + addon.addon_name);
    Logger.println(toNameEqualsValueString(addon.env, { addExports }));
  });

  envFromDeps.forEach((dep) => {
    Logger.println('# Dependency ' + dep.app_name);
    Logger.println(toNameEqualsValueString(dep.env, { addExports }));
  });
};

async function set (params) {
  const [envName, value] = params.args;
  const { alias } = params.options;

  const nameIsValid = validateName(envName);
  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  await application.updateEnvVar({ id: org_id, appId, envName }, { value }).then(sendToApi);

  Logger.println('Your environment variable has been successfully saved');
};

async function rm (params) {
  const [envName] = params.args;
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  await application.removeEnvVar({ id: org_id, appId, envName }).then(sendToApi);

  Logger.println('Your environment variable has been successfully removed');
};

async function importEnv (params) {
  const { alias } = params.options;
  const { org_id, app_id: appId } = await AppConfig.getAppData(alias).toPromise();

  const vars = await variables.readVariablesFromStdin();
  await application.updateAllEnvVars({ id: org_id, appId }, vars).then(sendToApi);

  Logger.println('Environment variables have been set');
};

module.exports = { list, set, rm, importEnv };
