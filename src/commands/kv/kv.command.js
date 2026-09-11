import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { RESP_TYPES, createClient } from 'redis';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { findAddonsByNameOrId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const URL_ENV_KEY = 'REDIS_URL';

/**
 * Connection options for a single command, then goodbye.
 *
 * A client that reconnects is a client that can send the same command twice: when the connection
 * drops after the server ran it but before its reply came back, a reconnecting client sends it
 * again, a server that already applied `INCR` applies it twice, and we print the second result as
 * a success. `reconnectStrategy: false` gives up rather than reconnect, and `disableOfflineQueue`
 * refuses to hold a command for a connection that does not exist yet.
 *
 * One connection, one attempt, and a plain error when it breaks. Whoever ran a write then knows to
 * check whether it landed, rather than being told it worked twice.
 */
const CONNECTION_OPTIONS = {
  socket: { reconnectStrategy: false },
  disableOfflineQueue: true,
};

/**
 * Hand back the reply the server sent, not the one node-redis finds friendlier.
 *
 * `HGETALL` answers a flat array of field and value; node-redis reads it as a map and returns an
 * object. Mapping `MAP` back to `Array` keeps `["field", "value", …]` — the shape a raw command
 * should produce, and the one `--format json` has always emitted.
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
 * Describe where we are connecting without handing out the way in.
 *
 * `REDIS_URL` carries the password, so it can never be logged as-is.
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
 * Render a reply for a person reading a terminal.
 *
 * A reply that is not a list prints as itself. A list prints one element per line, so `KEYS`,
 * `LRANGE` and `HGETALL` can be piped into the next command — `Logger.println` hands an array
 * straight to `console.log`, which used to print the JavaScript literal, quotes and all
 * (`[ 'a', 'b' ]`). Nested lists, as `SCAN` returns, are indented under their parent, so the
 * cursor stays readable next to the keys it goes with.
 *
 * This view is lossy on purpose and several replies render the same way: the indentation shows
 * depth but not where a sub-list starts and stops, a missing key and the string `null` both print
 * `null`, and a value that is not valid UTF-8 comes out as replacement characters. `--format json`
 * is the one to script against; this is the human view.
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
  // One element per line only means something while an element cannot itself contain a line
  // break: a value holding "a\nb" would otherwise read as two elements. Inside a list, backslashes,
  // LF and CR are escaped — and only those, so a tab or an ANSI escape sequence still reaches the
  // terminal as-is. A top-level reply is printed as text without this escaping.
  return `${indent}${String(reply).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('\r', '\\r')}`;
}

/**
 * Run one command on a fresh connection and close it.
 *
 * Only the command name is logged. The arguments and the reply are the customer's data — an
 * `AUTH`, a `SET` on a secret, a `GET` reading one back — and debug output ends up pasted into
 * issues and support tickets. Same reason the URL never appears: it holds the password. Nothing
 * scrubs the error either, because node-redis raises replies as errors carrying no properties of
 * their own — only the message the server chose to send, which is the answer and not ours to
 * rewrite.
 *
 * @param {string} url
 * @param {string[]} command
 * @returns {Promise<unknown>}
 */
async function sendCommand(url, command) {
  const [commandName] = command;

  Logger.debug(`Sending ${commandName} to ${describeTarget(url)}`);
  const client = createClient({ url, ...CONNECTION_OPTIONS });
  // node-redis throws an unhandled `error` event when nobody listens. The rejection raised by
  // `connect()` or `sendCommand()` already carries the reason, so this listener only keeps the
  // event from taking the process down before we get to report it.
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
      // the connection was never established, or is already gone — nothing left to close
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
      const formattedAddons = addons
        .map(({ addonId, ownerId }) => `\n${styleText('grey', `- ${addonId} (${ownerId})`)}`)
        .join('');
      throw new Error(`Several add-ons found for '${addonIdOrRealIdOrName}', use ID instead:${formattedAddons}`);
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
