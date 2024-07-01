'use strict';

const Application = require('../models/application.js');
const Logger = require('../logger.js');
const colors = require('colors/safe');
const variables = require('../models/variables.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');
const application = require('@clevercloud/client/cjs/api/v2/application.js');

async function list (params) {
  const { alias, app: appIdOrName, 'add-export': addExportsOption, format } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
    application.getAllEnvVars({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForAddons({ id: ownerId, appId }).then(sendToApi),
    application.getAllEnvVarsForDependencies({ id: ownerId, appId }).then(sendToApi),
  ]);

  switch (format) {
    case 'json': {
      Logger.printJson({
        env: envFromApp,
        fromAddons: envFromAddons.map((addon) => ({
          addonId: addon.addon_id,
          addonName: addon.addon_name,
          env: addon.env,
        })),
        fromDependencies: envFromDeps.map((dep) => ({
          addonId: dep.app_id,
          addonName: dep.app_name,
          env: dep.env,
        })),
      });
      break;
    }
    case 'shell':
    case 'human':
    default: {
      if (addExportsOption) {
        Logger.println(colors.yellow('`--add-export` option is deprecated. Use `--format shell` instead.'));
      }

      const addExports = addExportsOption || format === 'shell';

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
    }
  }
}

async function set (params) {
  const [envName, value] = params.args;
  const { alias, app: appIdOrName } = params.options;

  const nameIsValid = validateName(envName);
  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

  Logger.println('Your environment variable has been successfully saved');
};

async function rm (params) {
  const [envName] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

  Logger.println('Your environment variable has been successfully removed');
};

async function importEnv (params) {
  const { alias, app: appIdOrName, json } = params.options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const envVars = await variables.readVariablesFromStdin(format);
  await application.updateAllEnvVars({ id: ownerId, appId }, envVars).then(sendToApi);

  Logger.println('Environment variables have been set');
};

async function importVarsFromLocalEnv (params) {
  const [envNames] = params.args;
  const { alias, app: appIdOrName } = params.options;

  for (const envName of envNames) {
    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  for (const envName of envNames) {
    const value = process.env[envName] || '';
    await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
  }

  Logger.println('Your environment variables have been successfully saved');
};

module.exports = { list, set, rm, importEnv, importVarsFromLocalEnv };
