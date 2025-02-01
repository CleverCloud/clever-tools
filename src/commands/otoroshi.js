import openPage from 'open';
import colors from 'colors/safe.js';

import * as NG from '../models/ng.js';
import * as Otoroshi from '../models/otoroshi.js';
import * as Operator from '../models/operators.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';
import { resolveId } from '../models/application.js';

/** Check the version of an Otoroshi operator
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

  const version = await Operator.checkVersion('otoroshi', addonIdOrName);

  switch (format) {
    case 'json':
      Logger.printJson(version);
      break;
    case 'human':
    default:
      if (!version.needUpdate) {
        Logger.println(`${colors.green('✔')} Otoroshi operator ${colors.green(name)} is up to date`);
      }
      else {
        Logger.println(`🔄 Otoroshi operator ${colors.red(name)} is outdated`);
        Logger.println(`    ├─ Installed version: ${colors.red(version.installed)}`);
        Logger.println(`    └─ Latest version: ${colors.green(version.latest)}`);
        Logger.println();
        select({
          message: `Do you want to update it to ${colors.green(version.latest)} now?`,
          choices: ['Yes', 'No'],
        }).then(async (answer) => {
          if (answer === 'Yes') {
            await Operator.updateVersion('otoroshi', addonIdOrName, version.latest);
            Logger.println(colors.green('✔'), 'Your Otoroshi operator is up-to-date and being rebuilt…');
          }
        });
      }
      break;
  }
}

/** Get the details of an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const otoroshi = await Operator.getDetails('otoroshi', addonIdOrName);
  printOtoroshi(otoroshi, format);
}

export async function link (params) {
  const [appIdOrName, addonIdOrName] = params.args;
  const otoroshi = await get(null, addonIdOrName);
  const otoroshiApp = await get(otoroshi);

  const { appId } = await resolveId(appIdOrName);

  // Create a network group
  const { id: ngId } = await NG.create(null, `${otoroshi.realId}.${appId}`, null, null, [appId, otoroshiApp.appId]);

  // Get the application's member domain
  const memberDomain = `${appId}.m.${ngId}.ng.${NG.DOMAIN}`;

  // Create a route to the application, without TLS, on port 4242
  await Otoroshi.createOtoroshiRoute(otoroshi, otoroshiApp, {
    name: otoroshi.name,
    enabled: true,
    frontend: {
      domains: [memberDomain],
    },
    backend: {
      targets: [{
        id: appId,
        tls: false,
      }],
      root: '/',
    },
    plugins: [],
  });
  // Add basic auth to the route

  Logger.println(`${colors.green('✔')} Application ${colors.green(appIdOrName.app_id || appIdOrName.app_name)} linked to Otoroshi service ${colors.green(otoroshi.name)}`);
}

/**
 * List all Otoroshi operators
 * @returns {Promise<void>}
 */
export async function list () {
  const deployed = await Operator.listDeployed('otoroshi');

  if (deployed.length === 0) {
    Logger.println(`🔎 No Otoroshi operator found, create one with ${colors.blue('clever otoroshi create')} command`);
    return;
  }

  Logger.println(`🔎 Found ${deployed.length} Otoroshi operator${deployed.length > 1 ? 's' : ''}:`);
  Logger.println(deployed.map((otoroshi) => colors.grey(` • ${otoroshi.name} (${otoroshi.realId})`)).join('\n'));
}

export async function getRoutes (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const routes = await Otoroshi.getOtoroshiRoutes(addonIdOrName);

  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(routes, null, 2));
      break;
    case 'human':
    default:
      routes.forEach((route) => {
        const toPrint = {
          id: route.id,
          name: route.name,
          enabled: route.enabled,
          frontend: route.frontend.domains[0],
          backend: route.backend.targets[0].id,
          root: route.backend.root,
          tls: route.backend.targets[0].tls,
          plugins: route.plugins.length,
        };
        console.table(toPrint);
      });
      break;
  }
}

/** Open an Otoroshi operator in the browser
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function open (params) {
  const [addonIdOrName] = params.args;
  const otoroshi = await Operator.getDetails('otoroshi', addonIdOrName);

  Logger.println(`Opening Otoroshi operator ${colors.blue(otoroshi.addonId)} in the browser…`);
  await openPage(`https://${otoroshi.adminTargethost}`, { wait: false });
}

/** Open the Logs section of an Otoroshi Operator application in the Clever Cloud Console
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function openLogs (params) {
  const [addonIdOrName] = params.args;
  const otoroshi = await Operator.getDetails('otoroshi', addonIdOrName);

  Logger.println(`Opening Otoroshi operator logs ${colors.blue(otoroshi.addonId)} in the Clever Cloud Console…`);
  await openPage(`https://console.clever-cloud.com/organisations/${otoroshi.ownerId}/applications/${otoroshi.applications[0].javaId}/logs`, { wait: false });
}

/** Reboot an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function reboot (params) {
  const [addonIdOrName] = params.args;

  await Operator.reboot('otoroshi', addonIdOrName);
  Logger.println(`🔄 Rebooting Otoroshi operator ${colors.blue(addonIdOrName.addon_name)}…`);

}

/** Rebuild an Otoroshi operator
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 */
export async function rebuild (params) {
  const [addonIdOrName] = params.args;

  await Operator.rebuild('otoroshi', addonIdOrName);
  Logger.println(`🔄 Rebuilding Otoroshi operator ${colors.blue(addonIdOrName.addon_name)}…`);
}

/** Print the details of a Otoroshi operator
 * @param {object} otoroshi The Otoroshi operator object
 * @param {string} [format] The output format
 * @returns {void}
 */
function printOtoroshi (otoroshi, format = 'human') {
  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(otoroshi, null, 2));
      break;
    case 'human':
    default:
      console.table({
        // Name: otoroshi.name,
        ID: otoroshi.addonId,
        'Admin URL': `https://${otoroshi.adminTargethost}`,
        'API URL': `https://${otoroshi.apiHost}`,
      });
      break;
  }
}
