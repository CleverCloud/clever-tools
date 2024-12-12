import colors from 'colors/safe.js';
import * as NG from '../models/ng.js';
import { Logger } from '../logger.js';
import { resolveId } from '../models/application.js';
import { createOtoroshiRoute, getOtoroshi, getOtoroshiRoutes, getOrotoshiApp, listOtoroshis } from '../models/otoroshi.js';

export async function list () {
  const otoroshis = await listOtoroshis();

  if (otoroshis.length === 0) {
    Logger.println(`🔎 No Otoroshi service found, create one with ${colors.blue('clever otoroshi create')} command`);
    return;
  }

  Logger.println(`🔎 Found ${otoroshis.length} Otoroshi service${otoroshis.length > 1 ? 's' : ''}:`);
  Logger.println(otoroshis.map((otoroshi) => colors.grey(`- ${otoroshi.name} (${otoroshi.realId})`)).join('\n'));
}

export async function getRoutes (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const otoroshi = await getOtoroshi(null, addonIdOrName);
  otoroshi.env.sort((env1, env2) => env1.name.localeCompare(env2.name));

  const otoroshiApp = await getOrotoshiApp(otoroshi);

  const routes = await getOtoroshiRoutes(otoroshi, otoroshiApp);

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

export async function get (params) {
  const [addonIdOrName] = params.args;
  const { format } = params.options;

  const otoroshi = await getOtoroshi(null, addonIdOrName);
  otoroshi.env.sort((env1, env2) => env1.name.localeCompare(env2.name));

  const toPrint = {
    Name: otoroshi.name,
    ID: otoroshi.realId,
    Region: otoroshi.region,
    Plan: otoroshi.plan.slug,
    'Creation Date': new Date(otoroshi.creationDate).toLocaleDateString(),
  };

  switch (format) {
    case 'json':
      Logger.println(JSON.stringify(toPrint, null, 2));
      break;
    case 'human':
    default:
      console.table(toPrint);
      console.table(otoroshi.env.reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {}));
      break;
  }
}

export async function link (params) {
  const [appIdOrName, addonIdOrName] = params.args;
  const otoroshi = await getOtoroshi(null, addonIdOrName);
  const otoroshiApp = await getOrotoshiApp(otoroshi);

  const { appId } = await resolveId(appIdOrName);

  // Create a network group
  const { id: ngId } = await NG.create(null, `${otoroshi.realId}.${appId}`, null, null, [appId, otoroshiApp.appId]);

  // Get the application's member domain
  const memberDomain = `${appId}.m.${ngId}.ng.${NG.DOMAIN}`;

  // Create a route to the application, without TLS, on port 4242
  await createOtoroshiRoute(otoroshi, otoroshiApp, {
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
