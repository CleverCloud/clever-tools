import {
  getAllEnvVars,
  getAllEnvVarsForAddons,
  getAllEnvVarsForDependencies,
  removeEnvVar,
  updateAllEnvVars,
  updateEnvVar,
} from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString, validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { sendToApi } from '../models/send-to-api.js';
import * as variables from '../models/variables.js';

export async function list(options) {
  const { alias, app: appIdOrName, 'add-export': addExportsOption, format } = options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
    getAllEnvVars({ id: ownerId, appId }).then(sendToApi),
    getAllEnvVarsForAddons({ id: ownerId, appId }).then(sendToApi),
    getAllEnvVarsForDependencies({ id: ownerId, appId }).then(sendToApi),
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
        Logger.println(styleText('yellow', '`--add-export` option is deprecated. Use `--format shell` instead.'));
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

export async function set(options, envName, value) {
  const { alias, app: appIdOrName } = options;

  const nameIsValid = validateName(envName);
  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);

  Logger.println('Your environment variable has been successfully saved');
}

export async function rm(options, envName) {
  const { alias, app: appIdOrName } = options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await removeEnvVar({ id: ownerId, appId, envName }).then(sendToApi);

  Logger.println('Your environment variable has been successfully removed');
}

export async function importEnv(options) {
  const { alias, app: appIdOrName, json } = options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const envVars = await variables.readVariablesFromStdin(format);
  await updateAllEnvVars({ id: ownerId, appId }, envVars).then(sendToApi);

  Logger.println('Environment variables have been set');
}

export async function importVarsFromLocalEnv(options, envNames) {
  const { alias, app: appIdOrName } = options;

  for (const envName of envNames) {
    const nameIsValid = validateName(envName);
    if (!nameIsValid) {
      throw new Error(`Environment variable name ${envName} is invalid`);
    }
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  for (const envName of envNames) {
    const value = process.env[envName] || '';
    await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
  }

  Logger.println('Your environment variables have been successfully saved');
}
