import openPage from 'open';
import colors from 'colors/safe.js';

import * as Operator from '../models/operators.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';
import { sendToApi } from '../models/send-to-api.js';
import { ngDisableOperator, ngEnableOperator, versionCheck, versionUpdate } from '../clever-client/operators.js';
import { findAddonsByAddonProvider } from '../models/ids-resolver.js';

/** Check the version of an operator
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function operatorCheckVersion (provider, addonIdOrName, format) {

  const name = addonIdOrName.addon_name || addonIdOrName.realId || addonIdOrName;
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const versions = await versionCheck({ provider, realId }).then(sendToApi);

  switch (format) {
    case 'json':
      Logger.printJson(versions);
      break;
    case 'human':
    default:
      if (!versions.needUpdate || (provider === 'metabase' && versions.installed === 'community-latest')) {
        Logger.println(`${colors.green('✔', name)} is up-to-date (${colors.green(versions.installed)})`);
      }
      else {
        Logger.println(`🔄 ${colors.red(name)} is outdated`);
        Logger.println(`    ├─ Installed version: ${colors.red(versions.installed)}`);
        Logger.println(`    └─ Latest version: ${colors.green(versions.latest)}`);
        Logger.println();

        select({
          message: `Do you want to update it to ${colors.green(versions.latest)} now?`,
          choices: ['Yes', 'No'],
        }).then(async (answer) => {
          if (answer === 'Yes') {
            const body = JSON.stringify({ targetVersion: versions.latest });
            await versionUpdate({ provider, realId }, body).then(sendToApi);
            Logger.println(`${colors.green('✔', name)} is up-to-date and being rebuilt…`);
          }
        });
      }
      break;
  }
}

/** Update the version of an operator
 * @param {string} provider The operator's provider
 * @param {string} askedVersion The version to update to
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorUpdateVersion (provider, askedVersion, addonIdOrName) {
  const name = addonIdOrName.addon_name || addonIdOrName.realId || addonIdOrName;
  const realId = await Operator.getSingleRealId(addonIdOrName);

  const versions = await versionCheck({ provider, realId }).then(sendToApi);

  const targetVersion = askedVersion || await select({
    message: `Which version do you want to update ${colors.blue(name)} to, current is ${colors.blue(versions.installed)}?`,
    choices: versions.available.reverse(),
  });

  if (!versions.available.includes(targetVersion)) {
    throw new Error(`Version ${colors.red(targetVersion)} is not available`);
  }

  if (versions.installed === targetVersion) {
    Logger.println(`${colors.green('✔', name)} is already at version ${colors.green(targetVersion)}`);
    return;
  }

  const body = JSON.stringify({ targetVersion });
  await versionUpdate({ provider, realId }, body).then(sendToApi);
  Logger.println(`${colors.green('✔', name)} updated to ${colors.green(targetVersion)} and being rebuilt…`);
}

/** Unlink an operator from a Network Group
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function operatorNgDisable (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  if (!operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already disabled on ${colors.red(operator.name)}`);
  }

  await ngDisableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  Logger.println(`Disabling Network Group on ${colors.blue(operator.name)}…`);
}

/** Link an operator to a Network Group
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function operatorNgEnable (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  if (operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already enabled on ${colors.red(operator.name)}`);
  }

  await ngEnableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  Logger.println(`Enabling Network Group on ${colors.blue(operator.name)}…`);
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
        Logger.println(`🔎 No ${providerName} found, create one with ${colors.blue(`clever addon create ${providerName.toLocaleLowerCase()}`)} command`);
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

/** Open an operator dashboard in the Clever Cloud Console in the browser
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpen (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  Logger.println(`Opening ${colors.blue(operator.addonId)} in the browser…`);
  await openPage(`https://console.clever-cloud.com/goto/${operator.addonId}`, { wait: false });
}

/** Open the Logs section of an operator application in the Clever Cloud Console
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenLogs (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  Logger.println(`Opening ${colors.blue(operator.addonId)} logs in the Clever Cloud Console…`);
  await openPage(`https://console.clever-cloud.com/organisations/${operator.ownerId}/applications/${operator.resources.entrypoint}/logs`, { wait: false });
}

/** Open an operator Web UI in the browser
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenWebUi (provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  Logger.println(`Opening ${colors.blue(operator.addonId)} Management interface in the browser…`);
  await openPage(`${operator.accessUrl}`, { wait: false });
}

/** Reboot an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorReboot (provider, addonIdOrName) {
  await Operator.reboot(provider, addonIdOrName);
  Logger.println(`🔄 Restarting ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Rebuild an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {string} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorRebuild (provider, addonIdOrName) {
  await Operator.rebuild(provider, addonIdOrName);
  Logger.println(`🔄 Rebuilding ${colors.blue(addonIdOrName.addon_name)}…`);
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
    dataToPrint['Network Group'] = operator.features.networkGroup?.id || false;
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
