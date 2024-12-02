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
  const [addonIdOrRealId] = params.args;
  const { format } = params.options;

  const url = await getAddonUrl(addonIdOrRealId);
  const command = extractCommand(params.args);
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
* @param {string} addonIdOrRealId
 * @returns {Promise<string>} the URL of the compatible KV database
 */
async function getAddonUrl (addonIdOrRealId) {
  const foundAddons = await findAddonsByNameOrId(addonIdOrRealId);
  const { addonId, ownerId } = foundAddons[0];

  const envVars = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);
  const redisUrl = envVars.find((env) => env.name === URL_ENV_KEY)?.value;

  if (!redisUrl) {
    throw new Error(`Environment variable ${colors.red(URL_ENV_KEY)} not found, is it a Materia KV or Redis® add-on?`);
  }

  return redisUrl;
}

/**
 * Extract the command from the arguments
 * @param {Array<string>} args
 * @returns {Array<string>} the command
 */
function extractCommand (args) {
  args.shift();
  Logger.debug(`Extracted command: ${args.join(' ')}`);
  return [...args];
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
