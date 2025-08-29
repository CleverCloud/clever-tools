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
export async function get(params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;
  await operatorPrint('matomo', addonIdOrName, format);
}

/**
 * List all Matomo operators
 * @returns {Promise<void>}
 */
export async function list(params) {
  await operatorList('addon-matomo', params.options.format);
}

/**
 * Open a Matomo operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(params) {
  const [addonIdOrName] = params.args;
  await operatorOpen('matomo', addonIdOrName);
}

/**
 * Open the Logs section of a Matomo Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(params) {
  const [addonIdOrName] = params.args;
  await operatorOpenLogs('matomo', addonIdOrName);
}

/**
 * Open the Web UI of a Matomo Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(params) {
  const [addonIdOrName] = params.args;
  await operatorOpenWebUi('matomo', addonIdOrName);
}

/**
 * Reboot a Matomo operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(params) {
  const [addonIdOrName] = params.args;
  await operatorReboot('matomo', addonIdOrName);
}

/**
 * Rebuild a Matomo operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(params) {
  const [addonIdOrName] = params.args;
  await operatorRebuild('matomo', addonIdOrName);
}
