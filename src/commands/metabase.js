import openPage from 'open';
import colors from 'colors/safe.js';
import * as Operator from '../models/operators.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';

/** Check the version of a Metabase operator
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

  const version = await Operator.checkVersion('metabase', addonIdOrName);

  switch (format) {
    case 'json':
      Logger.printJson(version);
      break;
    case 'human':
    default:
      if (!version.needUpdate || version.installed === 'community-latest') {
        Logger.println(`${colors.green('✔')} Metabase operator ${colors.green(name)} is up to date`);
      }
      else {
        Logger.println(`🔄 Metabase operator ${colors.red(name)} is outdated`);
        Logger.println(`    ├─ Installed version: ${colors.red(version.installed)}`);
        Logger.println(`    └─ Latest version: ${colors.green(version.latest)}`);
        Logger.println();
        select({
          message: `Do you want to update it to ${colors.green(version.latest)} now?`,
          choices: ['Yes', 'No'],
        }).then(async (answer) => {
          if (answer === 'Yes') {
            await Operator.updateVersion('metabase', addonIdOrName, version.latest);
            Logger.println(colors.green('✔'), 'Your Metabase operator is up-to-date and being rebuilt…');
          }
        });
      }
      break;
  }
}

/** Get the details of a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const metabase = await Operator.getDetails('metabase', addonIdOrName);
  printMetabase(metabase, format);
}

/**
 * List all Metabase operators
 * @returns {Promise<void>}
 */
export async function list () {
  const deployed = await Operator.listDeployed('metabase');

  if (deployed.length === 0) {
    Logger.println(`🔎 No Metabase operator found, create one with ${colors.blue('clever addon create metabase')} command`);
    return;
  }
  Logger.println(`🔎 Found ${deployed.length} Metabase operator${deployed.length > 1 ? 's' : ''}:`);
  Logger.println(deployed.map((metabase) => ` • ${metabase.name} ${colors.grey(`(${metabase.realId})`)}`).join('\n'));
}

/** Open a Metabase operator in the browser
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open (params) {
  const [addonIdOrName] = params.args;
  const metabase = await Operator.getDetails('metabase', addonIdOrName);

  Logger.println(`Opening Metabase operator ${colors.blue(metabase.name)} in the browser…`);
  await openPage(`https://${metabase.accessUrl}`, { wait: false });
}

/** Open the Logs section of a Metabase Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs (params) {
  const [addonIdOrName] = params.args;
  const metabase = await Operator.getDetails('metabase', addonIdOrName);

  Logger.println(`Opening Metabase operator logs ${colors.blue(metabase.addonId)} in the Clever Cloud Console…`);
  await openPage(`https://console.clever-cloud.com/organisations/${metabase.ownerId}/applications/${metabase.resources.entrypoint}/logs`, { wait: false });
}

/** Reboot a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot (params) {
  const [addonIdOrName] = params.args;

  await Operator.reboot('metabase', addonIdOrName);
  Logger.println(`🔄 Rebooting Metabase operator ${colors.blue(addonIdOrName.addon_name)}…`);

}

/** Rebuild a Metabase operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild (params) {
  const [addonIdOrName] = params.args;

  await Operator.rebuild('metabase', addonIdOrName);
  Logger.println(`🔄 Rebuilding Metabase operator ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Print the details of a Metabase operator
 * @param {object} metabase The Metabase operator object
 * @param {string} [format] The output format
 * @returns {void}
 */
function printMetabase (metabase, format = 'human') {
  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(metabase, null, 2));
      break;
    case 'human':
    default:
      console.table({
        // Name: metabase.name,
        ID: metabase.resourceId,
        'Admin URL': metabase.accessUrl,
      });
      break;
  }
}
