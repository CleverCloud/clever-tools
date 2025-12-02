import {
  operatorCheckVersion,
  operatorList,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
  operatorUpdateVersion,
} from '../lib/operator-commands.js';

/**
 * Check the version of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function checkVersion(flags, addonIdOrName) {
  const { format } = flags;
  await operatorCheckVersion('metabase', addonIdOrName, format);
}

/**
 * Update the version of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion(flags, addonIdOrName) {
  const { target } = flags;
  await operatorUpdateVersion('metabase', target, addonIdOrName);
}

/**
 * Get the details of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(flags, addonIdOrName) {
  const { format } = flags;
  await operatorPrint('metabase', addonIdOrName, format);
}

/**
 * List all Metabase operators
 * @returns {Promise<void>}
 */
export async function list(flags) {
  await operatorList('metabase', flags.format);
}

/**
 * Open a Metabase operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(_flags, addonIdOrName) {
  await operatorOpen('metabase', addonIdOrName);
}

/**
 * Open the Logs section of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(_flags, addonIdOrName) {
  await operatorOpenLogs('metabase', addonIdOrName);
}

/**
 * Open the Web UI of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(_flags, addonIdOrName) {
  await operatorOpenWebUi('metabase', addonIdOrName);
}

/**
 * Reboot a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(_flags, addonIdOrName) {
  await operatorReboot('metabase', addonIdOrName);
}

/**
 * Rebuild a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(_flags, addonIdOrName) {
  await operatorRebuild('metabase', addonIdOrName);
}
