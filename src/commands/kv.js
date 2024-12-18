import Redis from 'ioredis';
import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import { sendToApi } from '../models/send-to-api.js';
import { getAllEnvVars } from '@clevercloud/client/cjs/api/v2/addon.js';
import { findAddonsByNameOrId } from '../models/ids-resolver.js';

const URL_ENV_KEY = 'REDIS_URL';
const MAX_RETRIES_PER_REQUEST = 1;

/**
 * Send a raw command to a compatible KV database
 * @param {Object} params
 * @param {Array<string>} params.args
 * @param {Object} params.options
 * @param {string} params.options.format
 * @returns {Promise<void>}
 */
export async function sendRawCommand (params) {
  const [addonIdOrRealIdOrName] = params.args;
  const { org, format } = params.options;

  const addons = await findAddonsByNameOrId(addonIdOrRealIdOrName, org);

  if (addons.length === 0) {
    throw new Error(`Add-on ${addonIdOrRealIdOrName} not found`);
  }

  if (addons.length > 1) {
    const formattedAddons = addons
      .map(({ addonId, ownerId }) => `\n${colors.grey(`- ${addonId} (${ownerId})`)}`)
      .join('');
    throw new Error(`Several add-ons found for '${addonIdOrRealIdOrName}', use ID instead:${formattedAddons}`);
  }

  const { addonId, ownerId } = addons[0];

  const url = await getAddonUrl(ownerId, addonId);

  Logger.debug(`Extracted command: ${params.args.join(' ')}`);
  const command = params.args.slice(1);

  const result = await sendCommand(url, command);

  switch (format) {
    case 'json': {
      Logger.printJson(result);
      break;
    }
    case 'human':
    default: {
      Logger.println(result);
    }
  }
}

/**
 * Get the URL of the compatible KV database
* @param {string} ownerId
* @param {string} addonId
 * @returns {Promise<string>} the URL of the compatible KV database
 */
async function getAddonUrl (ownerId, addonId) {

  const envVars = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);
  const redisUrl = envVars.find((env) => env.name === URL_ENV_KEY)?.value;

  if (!redisUrl) {
    throw new Error(`Environment variable ${colors.red(URL_ENV_KEY)} not found, is it a Materia KV or Redis® add-on?`);
  }

  return redisUrl;
}

/**
 * Send a command to a compatible KV database
 * @param {string} url
 * @param {Array<string>} command
 * @returns {Promise<string>} the command result
 */
async function sendCommand (url, command) {
  Logger.debug(`Sending command '${command.join(' ')}' to ${url}`);
  const client = new Redis(url, { maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST });
  try {
    const result = await client.call(...command);
    Logger.debug(`Command result: ${result}`);
    return result;
  }
  finally {
    await client.disconnect();
    Logger.debug('Disconnected from server');
  }
}
