import openPage from 'open';
import colors from 'colors/safe.js';
import Duration from 'duration-js';

import * as NG from '../models/ng.js';
import * as Otoroshi from '../models/otoroshi.js';
import * as Operator from '../models/operators.js';

import { Logger } from '../logger.js';
import { select } from '@inquirer/prompts';
import { resolveId } from '../models/application.js';
import { sendToApi } from '../models/send-to-api.js';
import { sendToOtoroshi } from '../models/otoroshi.js';
import { createBiscuitsVerifier, genBiscuitsToken, getBiscuitsVerifierTemplate, selectKeypair } from '../models/otoroshi-biscuits.js';
import { createApiKey, createRoute, deleteApiKey, deleteBiscuitVerifier, deleteRoute, getApiKeys, getApiKeyTemplate, getBiscuitVerifiers, getRoutes } from '../models/otoroshi-instances-api.js';
import { ngDisableOperator, ngEnableOperator } from '../models/operators-api.js';

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
  await printOtoroshi(otoroshi, format);
}

/**
 * Expose an application through an Otoroshi operator and a Network Group
 * @param {object} params The command's parameters
 * @param {object} params.args[0] The operator's name or ID
 * @param {object} [params.options.alias] The alias of the application
 * @param {object} [params.options.app] The application's name or ID
 * @param {object} [params.options.port] The port on which the application is exposed in the Network Group (default: 4242)
 * @param {object} [params.options.ttl] The duration to use to restrict Biscuit token validity (eg. 1d, 1w, 1m)
 * @param {object} [params.options.user] The user name to inject as fact and to check for Bisctuit token validity
 * @returns {Promise<void>}
 * @throws {Error} If the Otoroshi operator does not belong to the same organisation as the application
 */
export async function expose (params) {
  const [operatorIdOrName] = params.args;
  const { alias, app: appIdOrName, port, user, ttl } = params.options;
  const { ownerId, appId } = await resolveId(appIdOrName, alias);

  const biscuitProtected = user || ttl;

  const otoroshi = await Operator.getDetails('otoroshi', operatorIdOrName);
  const auth = await Otoroshi.getOtoroshiApiParams(operatorIdOrName);

  if (otoroshi.ownerId !== ownerId) {
    throw new Error(`The Otoroshi operator ${colors.red(otoroshi.addonId)} does not belong to the same organisation as ${colors.red(appId)}`);
  }

  const ngLabel = `${otoroshi.addonId.split('-')[0]}${appId.split('-')[0]}`.replaceAll('_', '');
  const ngInfo = await NG.create(ngLabel, null, null, [appId, otoroshi.javaId], { orga_id: ownerId });
  const ng = await NG.getNG(ngInfo.id, { orga_id: ownerId });

  const member = Object.values(ng.members).find((m) => m.id === appId);
  const memberDomain = member.domainName;

  const routeTemplate = {
    name: ng.label,
    enabled: true,
    frontend: {
      domains: [auth.routeBaseDomain],
    },
    backend: {
      targets: [{
        hostname: memberDomain,
        port: parseInt(port),
        id: appId,
        tls: false,
      }],
      root: '/',
    },
    plugins: [
      {
        enabled: true,
        debug: false,
        plugin: 'cp:otoroshi.next.plugins.ApikeyCalls',
      },
    ],
  };

  let route = {};

  let token = '';
  if (!biscuitProtected) {
    route = await createRoute(auth, routeTemplate).then(sendToOtoroshi);
    const apiKeyTemplate = await getApiKeyTemplate(auth).then(sendToOtoroshi);
    apiKeyTemplate.clientName = ng.label;
    apiKeyTemplate.authorizedEntities = [`route_${route.id}`];

    const apiKey = await createApiKey(auth, apiKeyTemplate).then(sendToOtoroshi);
    token = apiKey.bearer;
  }
  else {
    const keypair = await selectKeypair(operatorIdOrName);
    const verifier = await getBiscuitsVerifierTemplate(operatorIdOrName);

    const now = new Date();
    const durationMs = new Duration(ttl).milliseconds();
    const delay = new Date(now.getTime() + durationMs);
    const timeCheck = `check if time($time), $time <= ${delay.toISOString()};`;

    verifier.name = ng.label;
    verifier.keypair_ref = keypair.id;
    verifier.config.checks = [timeCheck];
    verifier.config.policies = [`allow if user("${user}");`];

    const createdVerifier = await createBiscuitsVerifier(operatorIdOrName, verifier);

    const verifierPlugin = {
      enabled: true,
      debug: false,
      plugin: 'cp:otoroshi_plugins.com.cloud.apim.otoroshi.extensions.biscuit.plugins.BiscuitTokenValidator',
      config: {
        verifier_ref: createdVerifier.id,
        extractor_type: 'header',
        extractor_name: 'Authorization',
      },
    };

    routeTemplate.plugins[0] = verifierPlugin;

    const payload = {
      keypair_ref: keypair.id,
      config: {
        checks: [],
        facts: [],
      },
    };

    if (user) {
      payload.config.facts.push(`user("${user}");`);
    }

    if (ttl) {
      payload.config.checks.push(timeCheck);
    }

    route = await createRoute(auth, routeTemplate).then(sendToOtoroshi);
    const biscuitToken = await genBiscuitsToken(operatorIdOrName, payload);
    token = biscuitToken.token;
  }

  Logger.println(`${colors.green('✔')} Your application is now exposed through a Network Group and an Otoroshi reverse proxy`);
  Logger.println(`    ├─ Port: ${colors.green(route.backend.targets[0].port)}`);
  Logger.println(`    └─ Try it: ${colors.green(`curl https://${route.frontend.domains[0]}${route.backend.root} -H 'Authorization: Bearer ${token}'`)}`);
}

/**
 * Unexpose an application through an Otoroshi operator and a Network Group
 * @param {object} params.args[0] The operator's name or ID
 * @param {object} params.options.alias The alias of the application
 * @param {object} params.options.app The application's name or ID
 * @returns {Promise<void>}
 */
export async function unexpose (params) {
  const [operatorIdOrName] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { appId } = await resolveId(appIdOrName, alias);

  const otoroshi = await Operator.getDetails('otoroshi', operatorIdOrName);

  const auth = await Otoroshi.getOtoroshiApiParams(operatorIdOrName);
  const toClean = `${otoroshi.addonId.split('-')[0]}${appId.split('-')[0]}`.replaceAll('_', '');

  try {
    await NG.destroy(toClean, { orga_id: otoroshi.ownerId });
    Logger.println(`${colors.green('✔')} Network Group ${colors.green(toClean)} has been deleted`);
  }
  catch {}

  try {
    const apiKeys = await getApiKeys(auth).then(sendToOtoroshi);
    const apiKey = apiKeys.find((k) => k.clientName === toClean);
    await deleteApiKey(auth, apiKey.clientId).then(sendToOtoroshi);
    Logger.println(`${colors.green('✔')} API Key for ${colors.green(toClean)} has been deleted`);
  }
  catch {}

  try {
    const verifiers = await getBiscuitVerifiers(auth).then(sendToOtoroshi);
    const verifier = verifiers.find((v) => v.name === toClean);
    await deleteBiscuitVerifier(auth, verifier.id).then(sendToOtoroshi);
    Logger.println(`${colors.green('✔')} Biscuit Verifier for ${colors.green(toClean)} has been deleted`);
  }
  catch {}

  try {
    const routes = await getRoutes(auth).then(sendToOtoroshi);
    const route = routes.find((r) => r.name === toClean);
    await deleteRoute(auth, route.id).then(sendToOtoroshi);
    Logger.println(`${colors.green('✔')} Route for ${colors.green(toClean)} has been deleted`);
  }
  catch {}
  Logger.println(`${colors.green('✔')} Application ${colors.green(appId)} is no longer exposed through a Network Group and an Otoroshi reverse proxy`);
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

export async function listRoutes (params) {
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

/** Unlink a Operator from a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function ngDisable (params) {
  const [addonIdOrName] = params.args;

  const otoroshi = await Operator.getDetails('otoroshi', addonIdOrName);
  if (!otoroshi.features.ng) {
    throw new Error(`Network Group is already disabled on Otoroshi operator ${colors.red(otoroshi.name)}`);
  }

  await ngDisableOperator({ provider: 'otoroshi', realId: otoroshi.resourceId }).then(sendToApi);
  Logger.println(`Disabling Network Group on Otoroshi operator ${colors.blue(otoroshi.name)}…`);

  get(params);
}

/** Link a Operator to a Network Group
 * @param {object} params The command's parameters
 * @param {string} params.args[0] The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function ngEnable (params) {
  const [addonIdOrName] = params.args;
  const otoroshi = await Operator.getDetails('otoroshi', addonIdOrName);

  if (otoroshi.features.ng) {
    throw new Error(`Network Group is already enabled on Otoroshi operator ${colors.red(addonIdOrName)}`);
  }

  await ngEnableOperator({ provider: 'otoroshi', realId: otoroshi.resourceId }).then(sendToApi);
  Logger.println(`Enabling Network Group on Otoroshi operator ${colors.blue(addonIdOrName)}…`);

  get(params);
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
  await openPage(`https://${otoroshi.accessUrl}`, { wait: false });
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
  await openPage(`https://console.clever-cloud.com/organisations/${otoroshi.ownerId}/applications/${otoroshi.resources.entrypoint}/logs`, { wait: false });
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
async function printOtoroshi (otoroshi, format = 'human') {
  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(otoroshi, null, 2));
      break;
    case 'human':
    default:
      console.table({
        // Name: otoroshi.name,
        ID: otoroshi.resourceId,
        'Admin URL': otoroshi.accessUrl,
        'API URL': otoroshi.api.url,
        'Network Group': otoroshi.features.ng ? otoroshi.features.ng : false,
      });
      break;
  }
}
