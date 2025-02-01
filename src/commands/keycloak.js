import openPage from 'open';
import colors from 'colors/safe.js';

import * as Operator from '../models/operators.js';
import * as Applications from '@clevercloud/client/esm/api/v2/application.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';
import { sendToApi } from '../models/send-to-api.js';
import { ngDisableKeycloak, ngEnableKeycloak } from '../models/keycloak-api.js';

/** Check the version of a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 * @throws {Error} If the operator name or ID is missing
 */
export async function checkVersion (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const name = addonIdOrName.addon_name || addonIdOrName.realId || addonIdOrName;

  if (!name) {
    throw new Error('You must provide an operator name or ID');
  }

  const version = await Operator.checkVersion('keycloak', addonIdOrName);

  switch (format) {
    case 'json':
      Logger.printJson(version);
      break;
    case 'human':
    default:
      if (!version.needUpdate) {
        Logger.println(`${colors.green('✔')} Keycloak operator ${colors.green(name)} is up to date`);
      }
      else {
        Logger.println(`🔄 Keycloak operator ${colors.red(name)} is outdated`);
        Logger.println(`    ├─ Installed version: ${colors.red(version.installed)}`);
        Logger.println(`    └─ Latest version: ${colors.green(version.latest)}`);
        Logger.println();
        select({
          message: `Do you want to update it to ${colors.green(version.latest)} now?`,
          choices: ['Yes', 'No'],
        }).then(async (answer) => {
          if (answer === 'Yes') {
            await Operator.updateVersion('keycloak', addonIdOrName, version.latest);
            Logger.println(colors.green('✔'), 'Your Keycloak operator is up-to-date and being rebuilt…');
          }
        });
      }
      break;
  }
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

  const keycloak = await Operator.getDetails('keycloak', addonIdOrName);
  await printKeycloak(keycloak, format);
}

/**
 * List all Keycloak operators
 * @returns {Promise<void>}
 */
export async function list () {
  const deployed = await Operator.listDeployed('keycloak');

  if (deployed.length === 0) {
    Logger.println(`🔎 No Keycloak operator found, create one with ${colors.blue('clever addon create keycloak')} command`);
    return;
  }
  Logger.println(`🔎 Found ${deployed.length} Keycloak operator${deployed.length > 1 ? 's' : ''}:`);
  Logger.println(deployed.map((keycloak) => ` • ${keycloak.name} ${colors.grey(`(${keycloak.realId})`)}`).join('\n'));
}

/** Unlink a Keycloak operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable (params) {
  const [addonIdOrName] = params.args;

  const keycloak = await Operator.getDetails('keycloak', addonIdOrName);
  if (!keycloak.networkgroupId) {
    throw new Error(`Network Group is already disabled on Keycloak operator ${colors.red(keycloak.addonId)}`);
  }

  await ngDisableKeycloak({ keycloakId: keycloak.addonId }).then(sendToApi);
  await Applications.update({ id: keycloak.ownerId, appId: keycloak.applications[0].javaId }, { minInstances: 1, maxInstances: 1 }).then(sendToApi);
  Logger.println(`Disabling Network Group on Keycloak operator ${colors.blue(keycloak.addonId)}…`);

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
  const { 'min-instances': minInstances, 'max-instances': maxInstances } = params.options;

  if ((!minInstances && !maxInstances) || (minInstances < 2 && maxInstances < 2)) {
    throw new Error(`Enabling Network Group is for Keycloak clusters only, use ${colors.red('--min-instances')} and/or ${colors.red('--max-instances')} to set the cluster size`);
  }

  if (minInstances && maxInstances && (minInstances > maxInstances)) {
    throw new Error(`Minimum instances (${colors.red(minInstances)}) must be less than or equal to maximum instances (${colors.red(maxInstances)})`);
  }

  if (minInstances > 5 || maxInstances > 5) {
    throw new Error('Keycloak clusters can\'t have more than 5 instances');
  }

  const keycloak = await Operator.getDetails('keycloak', addonIdOrName);

  if (keycloak.networkgroupId) {
    throw new Error(`Network Group is already enabled on Keycloak operator ${colors.red(keycloak.addonId)}`);
  }

  await ngEnableKeycloak({ keycloakId: keycloak.addonId }).then(sendToApi);
  await Applications.update({ id: keycloak.ownerId, appId: keycloak.applications[0].javaId }, { minInstances, maxInstances }).then(sendToApi);
  Logger.println(`Enabling Network Group on Keycloak operator ${colors.blue(keycloak.addonId)}…`);

  get(params);
}

/** Open a Keycloak operator in the browser
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open (params) {
  const [addonIdOrName] = params.args;
  const keycloak = await Operator.getDetails('keycloak', addonIdOrName);

  Logger.println(`Opening Keycloak operator ${colors.blue(keycloak.addonId)} in the browser…`);
  await openPage(`https://${keycloak.applications[0].host}`, { wait: false });
}

/** Open the Logs section of a Keycloak Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs (params) {
  const [addonIdOrName] = params.args;
  const keycloak = await Operator.getDetails('keycloak', addonIdOrName);

  Logger.println(`Opening Keycloak operator logs ${colors.blue(keycloak.addonId)} in the Clever Cloud Console…`);
  await openPage(`https://console.clever-cloud.com/organisations/${keycloak.ownerId}/applications/${keycloak.applications[0].javaId}/logs`, { wait: false });
}

/** Reboot a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot (params) {
  const [addonIdOrName] = params.args;

  await Operator.reboot('keycloak', addonIdOrName);
  Logger.println(`🔄 Rebooting Keycloak operator ${colors.blue(addonIdOrName.addon_name)}…`);

}

/** Rebuild a Keycloak operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild (params) {
  const [addonIdOrName] = params.args;

  await Operator.rebuild('keycloak', addonIdOrName);
  Logger.println(`🔄 Rebuilding Keycloak operator ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Print the details of a Keycloak operator
 * @param {object} keycloak The Keycloak operator object
 * @param {string} [format] The output format
 * @returns {void}
 */
async function printKeycloak (keycloak, format = 'human') {
  const instances = await Applications.get({ id: keycloak.ownerId, appId: keycloak.applications[0].javaId }).then(sendToApi);

  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(keycloak, null, 2));
      break;
    case 'human':
    default:
      console.table({
        // Name: keycloak.name,
        ID: keycloak.addonId,
        'Network Group': keycloak.networkgroupId ? keycloak.networkgroupId : false,
        'Min/Max Instances': `${instances.instance.minInstances}/${instances.instance.maxInstances}`,
      });
      break;
  }
}
