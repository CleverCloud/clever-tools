import jsonata from 'jsonata';
import { createClient } from 'redis';

import { sendToApi } from '../models/send-to-api.js';
import { getId as getAddonId } from '../models/addon.js';
import { resolveAddonId } from '../models/ids-resolver.js';
import { getId as getOrgId } from '../models/organisation.js';
import { getAllEnvVars } from '@clevercloud/client/cjs/api/v2/addon.js';

async function connect (params) {
  const { 'addon-id': addon, org } = params.options;
  const orgId = await getOrgId(org);

  const MAX_RETRIES = 10;
  const kvToken = await getAddonKvToken(addon, orgId) || process.env.KV_TOKEN;

  if (!kvToken) {
    throw new Error("No 'KV_TOKEN' found in environment variables");
  }

  const kvHost = 'materiakv.eu-fr-1.services.clever-cloud.com';
  const kvPort = '6379';
  const kvURI = `rediss://:${kvToken}@${kvHost}:${kvPort}`;

  let count = 0;
  const client = await createClient({ url: kvURI })
    .on('error', (err) => {
      if (count > MAX_RETRIES) {
        throw new Error(`Server connexion error: ${MAX_RETRIES} attempts failed. Exiting.`);
      }
      console.log('Server connexion error: ', err);
      count++;
    })
    .connect();

  return client;
}

async function getAddonKvToken (addon, orgId) {
  if (addon) {
    let addonId = null;
    if (addon.addon_id && !addon.addon_id.startsWith('addon_')) {
      addonId = await resolveAddonId(addon);
    }
    else {
      addonId = await getAddonId(orgId, addon);
    }

    if (addonId !== null && addonId.startsWith('addon_')) {
      const envFromAddon = await getAllEnvVars({ id: orgId, addonId }).then(sendToApi);
      return (envFromAddon.find((env) => env.name === 'KV_TOKEN') || {}).value;
    }
  }
}

async function isValidJSONAndHasName (jsonString, propertyToCheck) {
  const jsonObject = JSON.parse(jsonString);
  if (!jsonObject || typeof jsonObject !== 'object') {
    throw new Error('JSON object is not valid');
  }
  if (propertyToCheck === '') {
    return jsonObject;
  }
  if (!isNaN(propertyToCheck)) {
    propertyToCheck = `$[${propertyToCheck}]`;
  }

  const regex = /^\[(\d+)\]$/;
  const match = propertyToCheck.match(regex);
  if (match) {
    propertyToCheck = `$[${match[1]}]`;
  }

  const doesPropertyExist = await jsonata(`$exists(${propertyToCheck})`).evaluate(jsonObject);
  if (!doesPropertyExist) {
    throw new Error(`JSON object does not have property '${propertyToCheck}'`);
  }

  const result = jsonata(propertyToCheck).evaluate(jsonObject);
  return result;

}

export async function redis_raw (params) {
  const client = await connect(params);
  const value = await client.sendCommand(params.args);
  console.log(value);
  await client.disconnect();
}

export async function getjson (params) {
  const client = await connect(params);
  const [key, property] = params.args;
  const value = await client.GET(key);
  const jsonValue = await isValidJSONAndHasName(value, property);
  console.log(jsonValue);
  await client.disconnect();
}
