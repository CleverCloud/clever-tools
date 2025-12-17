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
export async function checkVersion(options, addonIdOrName) {
  const { format } = options;
  await operatorCheckVersion('otoroshi', addonIdOrName, format);
}

/**
 * Update the version of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion(options, addonIdOrName) {
  const { target } = options;
  await operatorUpdateVersion('otoroshi', target, addonIdOrName);
}

/**
 * Get the details of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(options, addonIdOrName) {
  const { format } = options;
  await operatorPrint('otoroshi', addonIdOrName, format);
}

/**
 * Print the configuration of an Otoroshi operator in otoroshictl format
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function getConfig(_options, addonIdOrName) {
  await operatorPrint('otoroshi', addonIdOrName, 'otoroshictl');
}

/**
 * List all Otoroshi operators
 * @returns {Promise<void>}
 */
export async function list(options) {
  await operatorList('otoroshi', options.format);
}

/**
 * Unlink a Operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable(_options, addonIdOrName) {
  await operatorNgDisable('otoroshi', addonIdOrName);
}

/**
 * Link a Operator to a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function ngEnable(_options, addonIdOrName) {
  await operatorNgEnable('otoroshi', addonIdOrName);
}

/**
 * Open an Otoroshi operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(_options, addonIdOrName) {
  await operatorOpen('otoroshi', addonIdOrName);
}

/**
 * Open the Logs section of an Otoroshi Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(_options, addonIdOrName) {
  await operatorOpenLogs('otoroshi', addonIdOrName);
}

/**
 * Open the Web UI of an Otoroshi Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(_options, addonIdOrName) {
  await operatorOpenWebUi('otoroshi', addonIdOrName);
}

/**
 * Reboot an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(_options, addonIdOrName) {
  await operatorReboot('otoroshi', addonIdOrName);
}

/**
 * Rebuild an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(_options, addonIdOrName) {
  await operatorRebuild('otoroshi', addonIdOrName);
}
