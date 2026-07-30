import { GetKeycloakInfoCommand } from '@clevercloud/client/cc-api-commands/keycloak/get-keycloak-info-command.js';
import { GetMatomoInfoCommand } from '@clevercloud/client/cc-api-commands/matomo/get-matomo-info-command.js';
import { GetMetabaseInfoCommand } from '@clevercloud/client/cc-api-commands/metabase/get-metabase-info-command.js';
import { GetOtoroshiInfoCommand } from '@clevercloud/client/cc-api-commands/otoroshi/get-otoroshi-info-command.js';
import dedent from 'dedent';
import { styleText } from '../lib/style-text.js';
import { clients } from './cc-api-client.js';
import { findAddonsByNameOrId } from './ids-resolver.js';

const GET_INFO_COMMANDS = {
  keycloak: GetKeycloakInfoCommand,
  matomo: GetMatomoInfoCommand,
  metabase: GetMetabaseInfoCommand,
  otoroshi: GetOtoroshiInfoCommand,
};

/**
 * Get the details of an operator from its name or ID
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The operator's details
 * @throws {Error} If the operator provider is unknown
 * @throws {Error} If the operator is not found
 */
export async function getDetails(provider, operatorIdOrName) {
  const GetInfoCommand = GET_INFO_COMMANDS[provider];
  if (GetInfoCommand == null) {
    throw new Error(`Unknown operator provider ${styleText('red', provider)}`);
  }

  const realId = await getSingleRealId(operatorIdOrName);

  return clients.ccApi.send(new GetInfoCommand({ addonId: realId }));
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
