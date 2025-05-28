import colors from 'colors/safe.js';
import * as application from '@clevercloud/client/esm/api/v2/application.js';

import { sendToApi } from './send-to-api.js';
import { findAddonsByNameOrId } from './ids-resolver.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { getAll as getAllAddons } from '@clevercloud/client/esm/api/v2/addon.js';
import { getOperator, rebootOperator, rebuildOperator } from '../clever-client/operators.js';

/**
 * Get the details of an operator from its name or ID
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The operator's details
 * @throws {Error} If the operator provider is unknown
 */
export async function getDetails (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  return getOperator({ provider, realId }).then(sendToApi);
}

/**
 * Get the real ID of an operator from its name or ID
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<string>} The operator's real ID
 * @throws {Error} If the operator is not found
 * @throws {Error} If the operator name is ambiguous
 */
export async function getSingleRealId (operatorIdOrName) {

  let operatorId = operatorIdOrName.operator_id;

  if (!operatorId) {
    const operator = await findAddonsByNameOrId(operatorIdOrName.addon_name || operatorIdOrName.addon_id || operatorIdOrName);

    if (operator.length === 0) {
      throw new Error(`Could not find ${colors.red(operatorIdOrName.addon_name)}`);
    }

    if (operator.length > 1) {
      throw new Error(`Ambiguous name ${colors.red(operatorIdOrName.addon_name)}, use the real ID instead:
${colors.grey(operator.map((otoroshi) => `- ${otoroshi.name} (${otoroshi.realId})`).join('\n'))}`);
    }

    operatorId = operator[0].realId;
  }

  return operatorId;
}

/** List all deployed operators for a given provider
 * @param {string} provider The operator's provider
 * @param {string} ownerId The owner's ID
 * @returns {Promise<object[]>} The list of deployed operators
*/
export async function listDeployed (provider, ownerId) {
  const addons = await getAllAddons({ id: ownerId }).then(sendToApi);
  const operators = addons.filter((addon) => addon.provider.id === provider);

  return operators;
}

/** Reboot an operator
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<void>}
 */
export async function reboot (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  await rebootOperator({ provider, realId }).then(sendToApi);
}

/** Rebuild an operator
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<void>}
 */
export async function rebuild (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  await rebuildOperator({ provider, realId }).then(sendToApi);
}

/** Set an environment variable for an given application
 * @param {string} ownerId The owner's ID
 * @param {string} appId The application's ID
 * @param {string} envName The environment variable's name
 * @param {string} value The environment variable's value
 * @returns {Promise<void>}
 * @throws {Error} If the environment variable name is invalid
 */
export async function setEnvVar (ownerId, appId, envName, value) {

  const nameIsValid = validateName(envName);

  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
}
