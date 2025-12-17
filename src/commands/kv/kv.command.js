import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import Redis from 'ioredis';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { findAddonsByNameOrId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const URL_ENV_KEY = 'REDIS_URL';

const MAX_RETRIES_PER_REQUEST = 1;

async function getAddonUrl(ownerId, addonId) {
  const envVars = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);
  const redisUrl = envVars.find((env) => env.name === URL_ENV_KEY)?.value;

  if (!redisUrl) {
    throw new Error(
      `Environment variable ${styleText('red', URL_ENV_KEY)} not found, is it a Materia KV or Redis® add-on?`,
    );
  }

  return redisUrl;
}

async function sendCommand(url, command) {
  Logger.debug(`Sending command '${command.join(' ')}' to ${url}`);
  const client = new Redis(url, { maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST });
  try {
    const result = await client.call(...command);
    Logger.debug(`Command result: ${result}`);
    return result;
  } finally {
    await client.disconnect();
    Logger.debug('Disconnected from server');
  }
}

export const kvCommand = defineCommand({
  description: 'Send a raw command to a Materia KV or Redis® add-on',
  since: '3.11.0',
  sinceDate: '2024-12-18',
  isExperimental: true,
  featureFlag: 'kv',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on',
      placeholder: 'kv-id|addon-id|addon-name',
    }),
    defineArgument({
      schema: z.string(),
      description: 'The raw command to send to the Materia KV or Redis® add-on',
      placeholder: 'command',
    }),
  ],
  async handler(options, addonIdOrRealIdOrName, ...restArgs) {
    const { org, format } = options;

    const addons = await findAddonsByNameOrId(addonIdOrRealIdOrName, org);

    if (addons.length === 0) {
      throw new Error(`Add-on ${addonIdOrRealIdOrName} not found`);
    }

    if (addons.length > 1) {
      const formattedAddons = addons
        .map(({ addonId, ownerId }) => `\n${styleText('grey', `- ${addonId} (${ownerId})`)}`)
        .join('');
      throw new Error(`Several add-ons found for '${addonIdOrRealIdOrName}', use ID instead:${formattedAddons}`);
    }

    const { addonId, ownerId } = addons[0];

    const url = await getAddonUrl(ownerId, addonId);

    Logger.debug(`Extracted command: ${restArgs.join(' ')}`);
    const command = restArgs;

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
  },
});
