import dedent from 'dedent';
import { getOperator } from '../clever-client/operators.js';
import { styleText } from '../lib/style-text.js';
import { findAddonsByNameOrId } from './ids-resolver.js';
import { sendToApi } from './send-to-api.js';

/**
 * Get the details of an operator from its name or ID
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The operator's details
 * @throws {Error} If the operator provider is unknown
 */
export async function getDetails(provider, operatorIdOrName) {
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
export async function getSingleRealId(operatorIdOrName) {
  if (operatorIdOrName.operator_id != null) {
    return operatorIdOrName.operator_id;
  }

  const name = operatorIdOrName.addon_name ?? operatorIdOrName.addon_id;
  const operators = await findAddonsByNameOrId(name);

  if (operators.length === 0) {
    throw new Error(`Could not find ${styleText('red', name)}`);
  }

  if (operators.length > 1) {
    throw new Error(dedent`
      Ambiguous name ${styleText('red', name)}, use the real ID instead:
        ${styleText('grey', operators.map((otoroshi) => `- ${otoroshi.name} (${otoroshi.realId})`).join('\n'))}
    `);
  }

  return operators[0].realId;
}
