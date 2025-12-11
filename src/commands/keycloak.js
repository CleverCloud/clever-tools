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
 * Check the version of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function checkVersion(options, addonIdOrName) {
  const { format } = options;
  await operatorCheckVersion('keycloak', addonIdOrName, format);
}

/**
 * Update the version of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function updateVersion(options, addonIdOrName) {
  const { target } = options;
  await operatorUpdateVersion('keycloak', target, addonIdOrName);
}

/**
 * Get the details of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get(options, addonIdOrName) {
  const { format } = options;
  await operatorPrint('keycloak', addonIdOrName, format);
}

/**
 * List all Keycloak operators
 * @returns {Promise<void>}
 */
export async function list(options) {
  await operatorList('keycloak', options.format);
}

/**
 * Unlink a Keycloak operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable(_options, addonIdOrName) {
  await operatorNgDisable('keycloak', addonIdOrName);
}

/**
 * Link a Keycloak operator to a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function ngEnable(_options, addonIdOrName) {
  await operatorNgEnable('keycloak', addonIdOrName);
}

/**
 * Open a Keycloak operator dashboard in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open(_options, addonIdOrName) {
  await operatorOpen('keycloak', addonIdOrName);
}

/**
 * Open the Logs section of a Keycloak Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs(_options, addonIdOrName) {
  await operatorOpenLogs('keycloak', addonIdOrName);
}

/**
 * Open the Web UI of a Keycloak Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openWebUi(_options, addonIdOrName) {
  await operatorOpenWebUi('keycloak', addonIdOrName);
}

/**
 * Restart a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot(_options, addonIdOrName) {
  await operatorReboot('keycloak', addonIdOrName);
}

/**
 * Rebuild a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild(_options, addonIdOrName) {
  await operatorRebuild('keycloak', addonIdOrName);
}
