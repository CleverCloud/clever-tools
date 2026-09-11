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

/**
 * Commands node-redis answers itself instead of handing the reply back.
 *
 * Subscribing parks the connection in a mode node-redis owns: it routes the confirmation to its own
 * pub/sub machinery and settles the pending promise through a counter that only `client.subscribe()`
 * sets. A raw `sendCommand` never sets it, so the command waits forever — with one channel as with
 * ten.
 *
 * These six names are node-redis' own, the ones `@redis/client` keys its pub/sub table by, and so
 * the ones that decide the hang. Asking the server instead looks better, since command flags need
 * no maintaining — but `pubsub` marks the family, not the mode: `PUBLISH` and `SPUBLISH` carry it
 * too, and they answer a plain integer that one connection serves perfectly well.
 */
const SUBSCRIPTION_COMMANDS = ['subscribe', 'unsubscribe', 'psubscribe', 'punsubscribe', 'ssubscribe', 'sunsubscribe'];

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
 * Say so when an integer reply may not have survived the trip exactly.
 *
 * Integer replies are read as JavaScript numbers, which represent whole values exactly only within
 * the safe integer range. Outside it some values still come through untouched — 9007199254740992 is
 * printed exactly as sent — while others are rounded: `INCR` on 9223372036854775806 answered
 * 9223372036854775807 to `redis-cli` and 9223372036854778000 here. We cannot tell the two apart
 * after the fact, since the rounding happened before the value reached us, so the warning says what
 * is actually known: the digits printed may not be the digits sent.
 *
 * Only whole numbers are considered: a `ZSCORE` answers 1.5 as a number too, and it is not an
 * integer that lost anything. And only the top-level reply is checked — an unsafe integer nested in
 * a list goes by unannounced.
 *
 * `Logger.warn` would be the house style, but it writes to stdout: a piped `--format json` would
 * then carry the warning into the JSON and break whatever reads it. So the warning goes to stderr,
 * wearing the same `/!\` a reader already sees elsewhere in the CLI.
 *
 * @param {unknown} reply
 */
function warnOnUnsafeInteger(reply) {
  if (Number.isInteger(reply) && !Number.isSafeInteger(reply)) {
    Logger.printErrorLine(
      styleText(
        'yellow',
        `/!\\ This integer is outside JavaScript's safe integer range (±${Number.MAX_SAFE_INTEGER}) and may have lost precision on the way out. Read the value back as text to see it exactly.`,
      ),
    );
  }
}

/**
 * Refuse the commands whose reply would never reach us.
 *
 * A subscription is answered by node-redis rather than handed back, and `CLIENT REPLY OFF` or
 * `CLIENT REPLY SKIP` ask the server itself to stop answering. Either way the command would hang;
 * refusing before connecting turns that into a sentence the reader can act on.
 *
 * @param {string} commandName
 * @param {string[]} commandArgs
 */
function assertOneShotCommand(commandName, commandArgs) {
  const name = commandName.toLowerCase();

  if (SUBSCRIPTION_COMMANDS.includes(name)) {
    throw new Error(
      `${commandName} needs a connection that outlives the command, and ${styleText('blue', 'clever kv')} sends one command then returns. Use a Redis® client for pub/sub.`,
    );
  }

  const argAt = (index) => (typeof commandArgs[index] === 'string' ? commandArgs[index].toUpperCase() : '');
  if (name === 'client' && argAt(0) === 'REPLY' && ['OFF', 'SKIP'].includes(argAt(1))) {
    throw new Error(
      `CLIENT REPLY ${argAt(1)} tells the server to stop answering, and ${styleText('blue', 'clever kv')} waits for exactly one reply`,
    );
  }
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
  const [commandName, ...commandArgs] = command;
  assertOneShotCommand(commandName, commandArgs);

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
    warnOnUnsafeInteger(result);

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
