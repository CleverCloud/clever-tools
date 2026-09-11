import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { RESP_TYPES, createClient } from '@redis/client';
import { z } from 'zod';
import { ambiguousNameError } from '../../lib/ambiguous-name-error.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { findAddonsByNameOrId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const URL_ENV_KEY = 'REDIS_URL';

/**
 * One connection, one attempt: never reconnect and never queue a command while disconnected.
 * A reconnecting client could replay a write the server already applied (an `INCR` counted twice),
 * so a dropped connection must surface as an error instead.
 */
const CONNECTION_OPTIONS = {
  socket: { reconnectStrategy: false },
  disableOfflineQueue: true,
};

/**
 * Return map replies as the flat `[field, value, ...]` array the server sent, as a raw command should,
 * instead of the object node-redis builds by default.
 */
const RAW_TYPE_MAPPING = { [RESP_TYPES.MAP]: Array };

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

/**
 * `REDIS_URL` carries the password, so only its host and port may be logged.
 *
 * @param {string} url
 * @returns {string} host and port only
 */
function describeTarget(url) {
  try {
    const { hostname, port } = new URL(url);
    return port ? `${hostname}:${port}` : hostname;
  } catch {
    return 'the add-on';
  }
}

/**
 * Human view of a reply: one list element per line so the output can be piped, nested lists indented.
 * Lossy on purpose (a nil and the string `null` look the same, sub-list bounds are not shown);
 * `--format json` is the format to script against.
 *
 * @param {unknown} reply
 * @param {boolean} [insideList]
 * @param {string} [indent]
 * @returns {string}
 */
function formatHuman(reply, insideList = false, indent = '') {
  if (Array.isArray(reply)) {
    if (reply.length === 0) {
      return `${indent}(empty list)`;
    }
    return reply.map((item) => formatHuman(item, true, Array.isArray(item) ? `${indent}  ` : indent)).join('\n');
  }
  if (!insideList) {
    return `${indent}${reply}`;
  }
  // Escape backslash, LF and CR inside lists so one element always stays on one line.
  return `${indent}${String(reply).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('\r', '\\r')}`;
}

/**
 * Run one command on a fresh connection and close it.
 * Debug logs carry the command name only: arguments and replies are customer data (secrets included)
 * and debug output gets pasted into issues.
 *
 * @param {string} url
 * @param {string[]} command
 * @returns {Promise<unknown>}
 */
async function sendCommand(url, command) {
  const [commandName] = command;

  Logger.debug(`Sending ${commandName} to ${describeTarget(url)}`);
  const client = createClient({ url, ...CONNECTION_OPTIONS });
  // Without a listener the `error` event crashes the process; the rejected promise already carries the reason.
  client.on('error', () => {});

  try {
    await client.connect();
    const result = await client.withTypeMapping(RAW_TYPE_MAPPING).sendCommand(command);
    Logger.debug(`${commandName} answered`);
    return result;
  } finally {
    try {
      client.destroy();
    } catch {
      // never connected or already gone, nothing to close
    }
    Logger.debug('Disconnected from server');
  }
}

export const kvCommand = defineCommand({
  description: 'Send a raw command to a Materia KV or Redis® add-on',
  since: '3.11.0',
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
      const candidates = addons.map(({ name, addonId, ownerId }) => ({
        name,
        id: addonId,
        details: `owner ${ownerId}`,
      }));
      throw ambiguousNameError(addonIdOrRealIdOrName, candidates);
    }

    const { addonId, ownerId } = addons[0];

    const url = await getAddonUrl(ownerId, addonId);

    const command = restArgs;
    Logger.debug(`Extracted command: ${command[0]} with ${command.length - 1} argument(s)`);

    const result = await sendCommand(url, command);

    switch (format) {
      case 'json': {
        Logger.printJson(result);
        break;
      }
      case 'human':
      default: {
        Logger.println(formatHuman(result));
      }
    }
  },
});
