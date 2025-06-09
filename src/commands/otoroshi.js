import {
  operatorCheckVersion,
  operatorList,
  operatorNgDisable,
  operatorNgEnable,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
  operatorUpdateVersion,
} from '../lib/operator-commands.js';

/**
 * Check the version of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function checkVersion (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;
  await operatorCheckVersion('otoroshi', addonIdOrName, format);
}

/**
 * Update the version of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion (params) {
  const [addonIdOrName] = params.args;
  const { target } = params.options;
  await operatorUpdateVersion('otoroshi', target, addonIdOrName);
}

/**
 * Get the details of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;
  await operatorPrint('otoroshi', addonIdOrName, format);
}

/**
 * List all Otoroshi operators
 * @returns {Promise<void>}
 */
export async function list (params) {
  await operatorList('otoroshi', params.options.format);
}

/**
 * Unlink a Operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable (params) {
  const [addonIdOrName] = params.args;
  await operatorNgDisable('otoroshi', addonIdOrName);
}

/**
 * Link a Operator to a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function ngEnable (params) {
  const [addonIdOrName] = params.args;
  await operatorNgEnable('otoroshi', addonIdOrName);
}

/**
 * Open an Otoroshi operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open (params) {
  const [addonIdOrName] = params.args;
  await operatorOpen('otoroshi', addonIdOrName);
}

/**
 * Open the Logs section of an Otoroshi Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs (params) {
  const [addonIdOrName] = params.args;
  await operatorOpenLogs('otoroshi', addonIdOrName);
}

/**
 * Open the Web UI of an Otoroshi Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi (params) {
  const [addonIdOrName] = params.args;
  await operatorOpenWebUi('otoroshi', addonIdOrName);
}

/**
 * Reboot an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot (params) {
  const [addonIdOrName] = params.args;
  await operatorReboot('otoroshi', addonIdOrName);
}

/**
 * Rebuild an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild (params) {
  const [addonIdOrName] = params.args;
  await operatorRebuild('otoroshi', addonIdOrName);
}
