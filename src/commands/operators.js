import openPage from 'open';
import colors from 'colors/safe.js';

import * as Operator from '../models/operators.js';
import * as Applications from '@clevercloud/client/esm/api/v2/application.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';
import { sendToApi } from '../models/send-to-api.js';
import { ngDisableOperator, ngEnableOperator } from '../models/operators-api.js';
import { findAddonsByAddonProvider } from '../models/ids-resolver.js';

/** Check the version of an operator
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function operatorCheckVersion (provider, addonIdOrName, format) {

  const name = addonIdOrName.addon_name || addonIdOrName.realId || addonIdOrName;
  const version = await Operator.checkVersion(provider, addonIdOrName);

  switch (format) {
    case 'json':
      Logger.printJson(version);
      break;
    case 'human':
    default:
      if (!version.needUpdate || (provider === 'metabase' && version.installed === 'community-latest')) {
        Logger.println(`${colors.green('✔')} operator ${colors.green(name)} is up to date`);
      }
      else {
        Logger.println(`🔄 Operator ${colors.red(name)} is outdated`);
        Logger.println(`    ├─ Installed version: ${colors.red(version.installed)}`);
        Logger.println(`    └─ Latest version: ${colors.green(version.latest)}`);
        Logger.println();

        select({
          message: `Do you want to update it to ${colors.green(version.latest)} now?`,
          choices: ['Yes', 'No'],
        }).then(async (answer) => {
          if (answer === 'Yes') {
            await Operator.updateVersion(provider, addonIdOrName, version.latest);
            Logger.println(colors.green('✔'), 'Your operator is up-to-date and being rebuilt…');
          }
        });
      }
      break;
  }
}

/** Unlink an operator from a Network Group
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function operatorNgDisable (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  if (!operator.features.ng) {
    throw new Error(`Network Group is already disabled on the operator ${colors.red(operator.name)}`);
  }

  await ngDisableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  if (provider === 'keycloak') {
    await Applications.update({ id: operator.ownerId, appId: operator.resources.entrypoint }, { minInstances: 1, maxInstances: 1 }).then(sendToApi);
  }

  Logger.println(`Disabling Network Group on the operator ${colors.blue(operator.name)}…`);
}

/** Link an operator to a Network Group
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function operatorNgEnable (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  if (operator.features.ng) {
    throw new Error(`Network Group is already enabled on the operator ${colors.red(operator.name)}`);
  }

  await ngEnableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  if (provider === 'keycloak') {
    await Applications.update({ id: operator.ownerId, appId: operator.resources.entrypoint }, { minInstances: 2, maxInstances: 2 }).then(sendToApi);
  }

  Logger.println(`Enabling Network Group on the operator ${colors.blue(operator.name)}…`);
}

/**
 * List all operators for a given provider
 * @param {string} provider The operator's provider
 * @param {string} format The output format
 * @returns {Promise<void>}
 */
export async function operatorList (provider, format) {
  const operatorsPerOwner = {};
  const deployed = await findAddonsByAddonProvider(provider);
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  switch (format) {
    case 'json':
      deployed.forEach((operator) => {
        if (!operatorsPerOwner[operator.ownerId]) {
          operatorsPerOwner[operator.ownerId] = [];
        }
        operatorsPerOwner[operator.ownerId].push(operator);
      });

      Logger.printJson(operatorsPerOwner);
      break;
    case 'human':
    default:

      if (deployed.length === 0) {
        Logger.println(`🔎 No ${providerName} operator found, create one with ${colors.blue('clever addon create addon-matomo')} command`);
        return;
      }
      Logger.println(`🔎 Found ${deployed.length} ${providerName} operator${deployed.length > 1 ? 's' : ''}:`);
      Logger.println();

      deployed.forEach((operator) => {
        if (!operatorsPerOwner[`${operator.ownerId} (${operator.ownerName})`]) {
          operatorsPerOwner[`${operator.ownerId} (${operator.ownerName})`] = [];
        }
        operatorsPerOwner[`${operator.ownerId} (${operator.ownerName})`].push(operator);
      });
      Object.entries(operatorsPerOwner).forEach(([ownerId, operators]) => {
        Logger.println(`• ${colors.bold(ownerId)}`);
        operators.forEach((operator) => {
          Logger.println(`  • ${operator.name} ${colors.grey(`(${operator.realId})`)}`);
        });
        Logger.println();
      });
      break;
  }
}

/** Open an operator in the browser
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpen (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  Logger.println(`Opening the operator ${colors.blue(operator.addonId)} in the browser…`);
  await openPage(`https://${operator.accessUrl}`, { wait: false });
}

/** Open the Logs section of an operator application in the Clever Cloud Console
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenLogs (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  Logger.println(`Opening the operator logs ${colors.blue(operator.addonId)} in the Clever Cloud Console…`);
  await openPage(`https://console.clever-cloud.com/organisations/${operator.ownerId}/applications/${operator.resources.entrypoint}/logs`, { wait: false });
}

/** Reboot an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorReboot (provider, addonIdOrName) {
  await Operator.reboot(provider, addonIdOrName);
  Logger.println(`🔄 Rebooting the operator ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Rebuild an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorRebuild (provider, addonIdOrName) {
  await Operator.rebuild(provider, addonIdOrName);
  Logger.println(`🔄 Rebuilding the operator ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Print the details of an operator
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @param {string} format The output format
 * @returns {void}
 */
export async function operatorPrint (provider, addonIdOrName, format) {

  const operator = await Operator.getDetails(provider, addonIdOrName);

  const dataToPrint = {
    Name: operator.name,
    ID: operator.resourceId,
    Owner: operator.ownerId,
  };

  dataToPrint.Version = provider === 'matomo'
    ? `${operator.version} (PHP ${operator.phpVersion})`
    : `${operator.version} (Java ${operator.javaVersion})`;

  dataToPrint['Access URL'] = operator.accessUrl;

  if (provider === 'otoroshi') {
    dataToPrint['API URL'] = operator.api.url;
  }

  if (['otoroshi', 'keycloak'].includes(provider)) {
    dataToPrint['Network Group'] = operator.features.ng || false;
  }

  switch (format) {
    case 'json':
      Logger.printJson(operator);
      break;
    case 'human':
    default:
      console.table(dataToPrint);
      break;
  }
}
