import { getAllExposedEnvVars, updateAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString, validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { sendToApi } from '../models/send-to-api.js';
import * as variables from '../models/variables.js';

export async function list(params) {
  const { alias, app: appIdOrName, format } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  const pairs = Object.entries(publishedConfigs).map(([name, value]) => ({ name, value }));

  switch (format) {
    case 'json': {
      Logger.printJson(pairs);
      break;
    }
    case 'shell':
      Logger.println(toNameEqualsValueString(pairs, { addExports: true }));
      break;
    case 'human':
    default: {
      Logger.println('# Published configs');
      Logger.println(toNameEqualsValueString(pairs, { addExports: false }));
    }
  }
}

export async function set(params) {
  const [varName, varValue] = params.args;
  const { alias, app: appIdOrName } = params.options;

  const nameIsValid = validateName(varName);
  if (!nameIsValid) {
    throw new Error(`Published config name ${varName} is invalid`);
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  publishedConfigs[varName] = varValue;
  await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully saved');
}

export async function rm(params) {
  const [varName] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
  delete publishedConfigs[varName];
  await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published config item has been successfully removed');
}

export async function importEnv(params) {
  const { alias, app: appIdOrName, json } = params.options;
  const format = json ? 'json' : 'name-equals-value';
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const publishedConfigs = await variables.readVariablesFromStdin(format);
  await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

  Logger.println('Your published configs have been set');
}
