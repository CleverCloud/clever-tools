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
export async function checkVersion(params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;
  await operatorCheckVersion('metabase', addonIdOrName, format);
}

/**
 * Update the version of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion(params) {
  const [addonIdOrName] = params.args;
  const { target } = params.options;
  await operatorUpdateVersion('metabase', target, addonIdOrName);
}

/**
 * Get the details of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;
  await operatorPrint('metabase', addonIdOrName, format);
}

/**
 * List all Metabase operators
 * @returns {Promise<void>}
 */
export async function list(params) {
  await operatorList('metabase', params.options.format);
}

/**
 * Open a Metabase operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(params) {
  const [addonIdOrName] = params.args;
  await operatorOpen('metabase', addonIdOrName);
}

/**
 * Open the Logs section of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(params) {
  const [addonIdOrName] = params.args;
  await operatorOpenLogs('metabase', addonIdOrName);
}

/**
 * Open the Web UI of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(params) {
  const [addonIdOrName] = params.args;
  await operatorOpenWebUi('metabase', addonIdOrName);
}

/**
 * Reboot a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(params) {
  const [addonIdOrName] = params.args;
  await operatorReboot('metabase', addonIdOrName);
}

/**
 * Rebuild a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(params) {
  const [addonIdOrName] = params.args;
  await operatorRebuild('metabase', addonIdOrName);
}
