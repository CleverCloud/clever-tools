import {
  operatorList,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
} from '../lib/operator-commands.js';

/**
 * Get the details of a Matomo operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(options, addonIdOrName) {
  const { format } = options;
  await operatorPrint('matomo', addonIdOrName, format);
}

/**
 * List all Matomo operators
 * @returns {Promise<void>}
 */
export async function list(options) {
  await operatorList('addon-matomo', options.format);
}

/**
 * Open a Matomo operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(_options, addonIdOrName) {
  await operatorOpen('matomo', addonIdOrName);
}

/**
 * Open the Logs section of a Matomo Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(_options, addonIdOrName) {
  await operatorOpenLogs('matomo', addonIdOrName);
}

/**
 * Open the Web UI of a Matomo Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(_options, addonIdOrName) {
  await operatorOpenWebUi('matomo', addonIdOrName);
}

/**
 * Reboot a Matomo operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(_options, addonIdOrName) {
  await operatorReboot('matomo', addonIdOrName);
}

/**
 * Rebuild a Matomo operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(_options, addonIdOrName) {
  await operatorRebuild('matomo', addonIdOrName);
}
