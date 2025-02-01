import Duration from 'duration-js';
import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import { deleteBiscuitsKeypair, genBiscuitsKeypair, genBiscuitsToken, getBiscuitsKeypair, getBiscuitsKeypairs, getBiscuitsKeyPairTemplate, selectKeypair } from '../models/otoroshi-biscuits.js';

/**
 * Generate and store a new key pair for a given Otoroshi operator
 * @param {Array} params - Command arguments
 * @param {Array} params.args[0] - Otoroshi operator ID or name
 * @param {Object} params.options - Command options
 * @param {String} params.options.format - Output format (json, human)
 * @returns {Promise<void>}
 */
export async function keypairGen (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const template = await getBiscuitsKeyPairTemplate(addonIdOrName);

  template.name = 'Biscuit CT Key Pair';
  template.description = 'A new Biscuit key pair created from Clever Tools';

  const keypair = await genBiscuitsKeypair(addonIdOrName, template);

  switch (format) {
    case 'json':
      Logger.printJson(keypair);
      break;
    case 'human':
    default:
      Logger.println(`🔑 New key pair successfully generated for Otoroshi operator ${colors.blue(addonIdOrName.addon_name)}`);
      Logger.println(`   └─ Public key: ${colors.green(keypair.pubKey)}`);
      break;
  }
}

/**
 * Generate and print a new token for a given Otoroshi operator
 * @param {Array} params - Command arguments
 * @param {Array} params.args[0] - Otoroshi operator ID or name
 * @param {Object} params.options - Command options
 * @param {String} params.options.format - Output format (json, human)
 * @param {String} params.options.ttl - Token time-to-live (e.g. 1d, 1h, 1m)
 * @param {String} params.options.user - User to bind the token to
 * @returns {Promise<void>}
 */
export async function tokenGen (params) {
  const [addonIdOrName] = params.args;
  const { format, ttl, user } = params.options;

  const keypair = await selectKeypair(addonIdOrName);

  const payload = {
    keypair_ref: keypair.id,
    config: {
      checks: [],
      facts: [],
    },
  };

  if (user) {
    payload.config.facts.push(`user("${user}");`);
  }

  if (ttl) {
    const now = new Date();
    const durationMs = new Duration(ttl).milliseconds();
    const delay = new Date(now.getTime() + durationMs);
    payload.config.checks.push(`check if time($time), $time <= ${delay.toISOString()};`);
  }

  const token = await genBiscuitsToken(addonIdOrName, payload);

  switch (format) {
    case 'json':
      Logger.printJson(token);
      break;
    case 'human':
    default:
      Logger.println(`🔑 New Token successfully generated for Otoroshi operator ${colors.blue(addonIdOrName.addon_name)}`);
      Logger.println(`   └─ Token: ${colors.green(token.token)}`);
      break;
  }
}

/**
 * Delete a key pair for a given Otoroshi operator
 * @param {Array} params - Command arguments
 * @param {Array} params.args[0] - Key pair ID
 * @param {Array} params.args[1] - Otoroshi operator ID or name
 * @returns {Promise<void>}
 */
export async function destroy (params) {
  const [keypairId, addonIdOrName] = params.args;
  await deleteBiscuitsKeypair(addonIdOrName, keypairId);

  Logger.println(`🔑 Key pair ${colors.green(keypairId)} successfully deleted!`);
}

/**
 * Get a key pair for a given Otoroshi operator
 * @param {Array} params - Command arguments
 * @param {Array} params.args[0] - Key pair ID
 * @param {Array} params.args[1] - Otoroshi operator ID or name
 * @param {Object} params.options - Command options
 * @param {String} params.options.format - Output format (json, human)
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [keypairId, addonIdOrName] = params.args;
  const { format } = params.options;
  const keypair = await getBiscuitsKeypair(addonIdOrName, keypairId);

  switch (format) {
    case 'json':
      Logger.printJson(keypair);
      break;
    case 'human':
    default:
      console.table(keypair);
      break;
  }
}

/**
 * List all key pairs for a given Otoroshi operator
 * @param {Array} params - Command arguments
 * @param {Array} params.args[0] - Otoroshi operator ID or name
 * @returns {Promise<void>}
 */
export async function list (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const keypairs = await getBiscuitsKeypairs(addonIdOrName);

  if (!keypairs.length) {
    Logger.println(`${colors.blue('ℹ')} No key pairs found for Otoroshi operator ${colors.blue(addonIdOrName.addon_name)}, create one with ${colors.blue('clever biscuits gen-keypair')} command`);
    return;
  }

  switch (format) {
    case 'json':
      Logger.printJson(keypairs);
      break;
    case 'human':
    default:
      keypairs.forEach((k) => {
        console.table(k);
      });
      break;
  }
}
