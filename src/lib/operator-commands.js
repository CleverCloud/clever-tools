import dedent from 'dedent';
import _ from 'lodash';
import { styleText } from 'node:util';
import {
  ngDisableOperator,
  ngEnableOperator,
  rebootOperator,
  rebuildOperator,
  versionCheck,
  versionUpdate,
} from '../clever-client/operators.js';
import { Logger } from '../logger.js';
import { conf } from '../models/configuration.js';
import { findAddonsByAddonProvider } from '../models/ids-resolver.js';
import * as Operator from '../models/operator.js';
import { sendToApi } from '../models/send-to-api.js';
import { openBrowser } from '../models/utils.js';
import { confirm, selectAnswer } from './prompts.js';

/**
 * Check the version of an operator
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function operatorCheckVersion(provider, addonIdOrName, format) {
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const name = getDisplayName(addonIdOrName);
  const versions = await versionCheck({ provider, realId }).then(sendToApi);

  switch (format) {
    case 'json':
      Logger.printJson(versions);
      break;
    case 'human':
    default:
      if (!versions.needUpdate || (provider === 'metabase' && versions.installed === 'community-latest')) {
        Logger.printSuccess(`${styleText('green', name)} is up-to-date (${styleText('green', versions.installed)})`);
      } else {
        Logger.println(dedent`
          🔄 ${styleText('red', name)} is outdated
             • Installed version: ${styleText('red', versions.installed)}
             • Latest version: ${styleText('green', versions.latest)}
        `);
        Logger.println();

        await confirm(
          `Do you want to update it to ${styleText('green', versions.latest)} now?`,
          'No confirmation, aborting version update',
        );

        await versionUpdate({ provider, realId }, { targetVersion: versions.latest }).then(sendToApi);
        Logger.printSuccess(`${styleText('green', name)} is up-to-date and being rebuilt…`);
      }
      break;
  }
}

/**
 * Update the version of an operator
 * @param {string} provider The operator's provider
 * @param {string} askedVersion The version to update to
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorUpdateVersion(provider, askedVersion, addonIdOrName) {
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const name = getDisplayName(addonIdOrName);

  const versions = await versionCheck({ provider, realId }).then(sendToApi);

  const targetVersion =
    askedVersion ??
    (await selectAnswer(
      `Which version do you want to update ${styleText('blue', name)} to, current is ${styleText('blue', versions.installed)}?`,
      versions.available.reverse(),
    ));

  if (!versions.available.includes(targetVersion)) {
    throw new Error(`Version ${styleText('red', targetVersion)} is not available`);
  }

  if (versions.installed === targetVersion) {
    Logger.printSuccess(`${styleText('green', name)} is already at version ${styleText('green', targetVersion)}`);
    return;
  }

  await versionUpdate({ provider, realId }, { targetVersion }).then(sendToApi);
  Logger.printSuccess(`${styleText('green', name)} updated to ${styleText('green', targetVersion)} and being rebuilt…`);
}

/**
 * Unlink an operator from a Network Group
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function operatorNgDisable(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const operator = await Operator.getDetails(provider, addonIdOrName);
  if (!operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already disabled on ${styleText('red', name)}`);
  }

  await ngDisableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  Logger.println(`Disabling Network Group on ${styleText('blue', name)}…`);

  await operatorPrint(provider, addonIdOrName);
}

/**
 * Link an operator to a Network Group
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function operatorNgEnable(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const operator = await Operator.getDetails(provider, addonIdOrName);

  if (operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already enabled on ${styleText('red', name)}`);
  }

  await ngEnableOperator({ provider, realId: operator.resourceId }).then(sendToApi);
  Logger.println(`Enabling Network Group on ${styleText('blue', name)}…`);

  await operatorPrint(provider, addonIdOrName);
}

/**
 * List all operators for a given provider
 * @param {string} provider The operator's provider
 * @param {string} format The output format
 * @returns {Promise<void>}
 */
export async function operatorList(provider, format) {
  const deployed = await findAddonsByAddonProvider(provider);
  const providerName = _.capitalize(provider.replace('addon-', ''));
  const operatorsPerOwner = _.groupBy(deployed, 'ownerId');

  switch (format) {
    case 'json':
      Logger.printJson(operatorsPerOwner);
      break;
    case 'human':
    default:
      if (deployed.length === 0) {
        Logger.println(
          `🔎 No ${providerName} found, create one with ${styleText('blue', `clever addon create ${providerName.toLocaleLowerCase()}`)} command`,
        );
        return;
      }

      Logger.println(`🔎 Found ${deployed.length} ${providerName} operator${deployed.length > 1 ? 's' : ''}:`);
      Logger.println();

      Object.values(operatorsPerOwner).forEach((operators) => {
        Logger.println(`• ${styleText('bold', `${operators[0].ownerId} (${operators[0].ownerName})`)}`);
        operators.forEach((operator) => {
          Logger.println(`  • ${operator.name} ${styleText('grey', `(${operator.realId})`)}`);
        });
        Logger.println();
      });
      break;
  }
}

/**
 * Open an operator dashboard in the Clever Cloud Console in the browser
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpen(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(
    `${conf.GOTO_URL}/${operator.addonId}`,
    `🌐 Opening ${styleText('blue', operator.addonId)} in the browser…`,
  );
}

/**
 * Open the Logs section of an operator application in the Clever Cloud Console
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenLogs(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(
    `/organisations/${operator.ownerId}/applications/${operator.resources.entrypoint}/logs`,
    `🌐 Opening ${styleText('blue', operator.addonId)} logs in the Clever Cloud Console…`,
  );
}

/**
 * Open an operator Web UI in the browser
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenWebUi(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(
    operator.accessUrl,
    `🌐 Opening ${styleText('blue', operator.addonId)} Management interface in the browser…`,
  );
}

/**
 * Reboot an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorReboot(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const realId = await Operator.getSingleRealId(addonIdOrName);
  await rebootOperator({ provider, realId }).then(sendToApi);
  Logger.println(`🔄 Restarting ${styleText('blue', name)}…`);
}

/**
 * Rebuild an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorRebuild(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const realId = await Operator.getSingleRealId(addonIdOrName);
  await rebuildOperator({ provider, realId }).then(sendToApi);
  Logger.println(`🔄 Rebuilding ${styleText('blue', name)}…`);
}

/**
 * Print the details of an operator
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @param {string} format The output format
 * @returns {void}
 */
export async function operatorPrint(provider, addonIdOrName, format = 'human') {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  const dataToPrint = {
    Name: operator.name,
    ID: operator.resourceId,
    Owner: operator.ownerId,
  };

  dataToPrint.Version =
    provider === 'matomo'
      ? `${operator.version} (PHP ${operator.phpVersion})`
      : `${operator.version} (Java ${operator.javaVersion})`;

  dataToPrint['Access URL'] = operator.accessUrl;

  if (provider === 'otoroshi') {
    dataToPrint['API URL'] = operator.api.url;
  }

  if (['otoroshi', 'keycloak'].includes(provider)) {
    dataToPrint['Network Group'] = operator.features.networkGroup?.id ?? false;
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

function getDisplayName(addonIdOrName) {
  return addonIdOrName.addon_name ?? addonIdOrName.operator_id ?? addonIdOrName.addon_id;
}
