import { getAll as getAllAddons, getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { sendToApi } from '../models/send-to-api.js';
import colors from 'colors/safe.js';

import * as application from '@clevercloud/client/esm/api/v2/application.js';
import { resolveId } from '../models/application.js';

export async function listOtoroshis (ownerId) {
  const addons = await getAllAddons({ id: ownerId }).then(sendToApi);
  const otoroshis = addons.filter((addon) => addon.provider.id === 'otoroshi');
  return otoroshis;
}

export async function getOtoroshi (ownerId, addonIdOrName) {
  const addons = await getAllAddons({ id: ownerId }).then(sendToApi);
  const otoroshi = addons
    .find((addon) => addon.provider.id === 'otoroshi'
      && (addon.name === addonIdOrName
        || addon.id === addonIdOrName
        || addon.realId === addonIdOrName));

  if (otoroshi == null) {
    throw new Error(`Could not find Otoroshi service with name ${colors.red(addonIdOrName)}`);
  }

  if (otoroshi.length > 1) {
    throw new Error(`Ambiguous Otoroshi service name ${colors.red(addonIdOrName)}, use the real ID instead:
${colors.grey(otoroshi.map((otoroshi) => `- ${otoroshi.name} (${otoroshi.realId})`).join('\n'))}`);
  }

  const env = await getAllEnvVars({ id: ownerId, addonId: otoroshi.id }).then(sendToApi);
  otoroshi.env = env;

  return otoroshi;
}

export async function getOrotoshiApp (otoroshi) {
  const otoroshiAppName = otoroshi.realId.replace(/otoroshi_/, otoroshi.name + ' - ');
  const otoroshiApp = await resolveId({ app_name: otoroshiAppName });
  otoroshiApp.env = await application.getAllEnvVars({ id: null, appId: otoroshiApp.appId }).then(sendToApi);

  return otoroshiApp;
}

export async function getOtoroshiApiParams (otoroshi, otoroshiApp) {
  if (!otoroshiApp) {
    otoroshiApp = await getOrotoshiApp(otoroshi);
  }

  return {
    url: otoroshi.env.find((env) => env.name === 'CC_OTOROSHI_API_URL').value,
    id: otoroshiApp.env.find((env) => env.name === 'ADMIN_API_CLIENT_ID').value,
    secret: otoroshiApp.env.find((env) => env.name === 'ADMIN_API_CLIENT_SECRET').value,
  };
}

export async function getOtoroshiRoutes (otoroshi, otoroshiApp) {
  const otoroshiAPI = await getOtoroshiApiParams(otoroshi, otoroshiApp);
  const routes = await otoroshiRequest(
    otoroshiAPI,
    '/apis/proxy.otoroshi.io/v1/routes',
    'GET',
  );
  return routes;
}

export async function createOtoroshiRoute (otoroshi, otoroshiApp, route) {

}

async function otoroshiRequest (otoroshiApiParams, route, method, body) {
  const auth = Buffer.from(`${otoroshiApiParams.id}:${otoroshiApiParams.secret}`).toString('base64');
  const url = `${otoroshiApiParams.url}${route}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  }).then((res) => res.json());

  if (response.error) {
    throw new Error(response.error);
  }

  return response;
}
