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
export async function checkVersion(options, addonIdOrName) {
  const { format } = options;
  await operatorCheckVersion('metabase', addonIdOrName, format);
}

/**
 * Update the version of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion(options, addonIdOrName) {
  const { target } = options;
  await operatorUpdateVersion('metabase', target, addonIdOrName);
}

/**
 * Get the details of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(options, addonIdOrName) {
  const { format } = options;
  await operatorPrint('metabase', addonIdOrName, format);
}

/**
 * List all Metabase operators
 * @returns {Promise<void>}
 */
export async function list(options) {
  await operatorList('metabase', options.format);
}

/**
 * Open a Metabase operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(_options, addonIdOrName) {
  await operatorOpen('metabase', addonIdOrName);
}

/**
 * Open the Logs section of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(_options, addonIdOrName) {
  await operatorOpenLogs('metabase', addonIdOrName);
}

/**
 * Open the Web UI of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(_options, addonIdOrName) {
  await operatorOpenWebUi('metabase', addonIdOrName);
}

/**
 * Reboot a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(_options, addonIdOrName) {
  await operatorReboot('metabase', addonIdOrName);
}

/**
 * Rebuild a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(_options, addonIdOrName) {
  await operatorRebuild('metabase', addonIdOrName);
}
