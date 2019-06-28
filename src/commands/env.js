'use strict';

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const variables = require('../models/variables.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');
const application = require('@clevercloud/client/cjs/api/application.js');

async function list (params) {
  const { alias, 'add-export': addExports } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
    application.getAllEnvVars({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForAddons({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForDependencies({ id: ownerId, appId }).then(sendToApi),
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

  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

  Logger.println('Your environment variable has been successfully saved');
};

async function rm (params) {
  const [envName] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await application.removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

  Logger.println('Your environment variable has been successfully removed');
};

async function importEnv (params) {
  const { alias, json } = params.options;
  const format = json ? 'json' : 'env';
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const vars = await variables.readVariablesFromStdin(format);
  await application.updateAllEnvVars({ id: ownerId, appId }, vars).then(sendToApi);

  Logger.println('Environment variables have been set');
};

async function importEnvVars (params) {
  const [envNames] = params.args;
  const { alias } = params.options;

  for (const envName of envNames) {
    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }
  }

  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  for (const envName of envNames) {
    const value = process.env[envName] || '';
    await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
  }

  Logger.println('Your environment variables have been successfully saved');
};

module.exports = { list, set, rm, importEnv, importEnvVars };
