'use strict';

const { createClient } = require('redis');
const jsonata = require('jsonata');

const { getAllEnvVars } = require('@clevercloud/client/cjs/api/v2/addon.js');
const { resolveAddonId } = require('../models/ids-resolver.js');
const Organisation = require('../models/organisation.js');
const { sendToApi } = require('../models/send-to-api.js');
const { getId } = require('../models/addon.js');

async function connect (params) {
  const { 'addon-id': addon, org } = params.options;
  const orgId = await Organisation.getId(org);

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
      addonId = await getId(orgId, addon);
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

async function exists (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.EXISTS(key);
  console.log(value);
  await client.disconnect();
}

async function get (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.GET(key);
  console.log(value);
  await client.disconnect();
}

async function keys (params) {
  const client = await connect(params);
  const [pattern] = params.args;
  const value = await client.KEYS(pattern);
  console.log(value);
  await client.disconnect();
}

async function type (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.TYPE(key);
  console.log(value);
  await client.disconnect();
}

async function strlen (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.STRLEN(key);
  console.log(value);
  await client.disconnect();
}

async function getjson (params) {
  const client = await connect(params);
  const [key, property] = params.args;
  const value = await client.GET(key);
  const jsonValue = await isValidJSONAndHasName(value, property);
  console.log(jsonValue);
  await client.disconnect();
}

async function set (params) {
  const client = await connect(params);
  const [key, value] = params.args;
  await client.SET(key, value);
  console.log({ [key]: value });
  await client.disconnect();
}

async function append (params) {
  const client = await connect(params);
  const [key, value] = params.args;
  await client.APPEND(key, value);
  console.log({ [key]: value });
  await client.disconnect();
}

async function incr (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.INCR(key);
  console.log(value);
  await client.disconnect();
}

async function decr (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.DECR(key);
  console.log(value);
  await client.disconnect();
}

async function del (params) {
  const client = await connect(params);
  const [key] = params.args;
  const value = await client.DEL(key);
  console.log(value);
  await client.disconnect();
}

async function flushdb (params) {
  const client = await connect(params);
  const value = await client.FLUSHDB();
  console.log(value);
  await client.disconnect();
}

async function ping (params) {
  const client = await connect(params);
  const value = await client.PING();
  console.log(value);
  await client.disconnect();
}

async function scan (params) {
  const client = await connect(params);
  const value = await client.SCAN(0);
  console.log(value);
  await client.disconnect();
}

async function dbsize (params) {
  const client = await connect(params);
  const value = await client.DBSIZE();
  console.log(value);
  await client.disconnect();
}

async function commands_list (params) {
  const client = await connect(params);
  const commands = await client.COMMAND_LIST();
  const sorted_commands = commands.sort();
  sorted_commands.forEach((c) => {
    console.log(c);
  });
  await client.disconnect();
}

async function redis_raw (params) {
  const client = await connect(params);
  const [commands] = params.args;
  const commandsArray = commands.split(' ');
  const value = await client.sendCommand(commandsArray);
  console.log(value);
  await client.disconnect();
}

module.exports = {
  append,
  commands_list,
  dbsize,
  decr,
  del,
  exists,
  flushdb,
  get,
  getjson,
  incr,
  keys,
  ping,
  redis_raw,
  scan,
  set,
  strlen,
  type,
};
