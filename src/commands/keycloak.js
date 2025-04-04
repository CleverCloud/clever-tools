import { operatorCheckVersion, operatorList, operatorNgDisable, operatorNgEnable, operatorOpen, operatorOpenLogs, operatorPrint, operatorReboot, operatorRebuild } from '../lib/operators.js';

/** Check the version of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function checkVersion (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  await operatorCheckVersion('keycloak', addonIdOrName, format);

}

/** Get the details of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  await operatorPrint('keycloak', addonIdOrName, format);
}

/**
 * List all Keycloak operators
 * @returns {Promise<void>}
 */
export async function list (params) {
  await operatorList('keycloak', params.options.format);
}

/** Unlink a Keycloak operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable (params) {
  const [addonIdOrName] = params.args;
  await operatorNgDisable('keycloak', addonIdOrName);
  get(params);
}

/** Link a Keycloak operator to a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function ngEnable (params) {
  const [addonIdOrName] = params.args;
  await operatorNgEnable('keycloak', addonIdOrName);
  get(params);
}

/** Open a Keycloak operator in the browser
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open (params) {
  const [addonIdOrName] = params.args;
  await operatorOpen('keycloak', addonIdOrName);
}

/** Open the Logs section of a Keycloak Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs (params) {
  const [addonIdOrName] = params.args;
  await operatorOpenLogs('keycloak', addonIdOrName);
}

/** Reboot a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot (params) {
  const [addonIdOrName] = params.args;
  await operatorReboot('keycloak', addonIdOrName);
}

/** Rebuild a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild (params) {
  const [addonIdOrName] = params.args;
  await operatorRebuild('keycloak', addonIdOrName);
}
