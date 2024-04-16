'use strict';
const { createClient } = require ('redis');
const jsonata = require('jsonata');

const MAX_RETRIES = 10;

async function connect () {
    const kvToken = process.env.KV_TOKEN;
    if (!kvToken)
        throw "No 'KV_TOKEN' found in environment variables";

    const kvHost = 'kv.materiadb.eu-fr-1.services.clever-cloud.com';
    const kvPort = '6379';
    const kvURI = `rediss://:${kvToken}@${kvHost}:${kvPort}`;

    let count = 0;
    const client = await createClient( {url: kvURI} )
        .on('error', err =>
        {
            if (count > MAX_RETRIES)
                throw `Server connexion error: ${MAX_RETRIES} attempts failed. Exiting.`
            console.log('Server connexion error: ', err);
            count++;
        })
        .connect();

        return client;
}

async function isValidJSONAndHasName(jsonString, propertyToCheck) {
    try {
        const jsonObject = JSON.parse(jsonString);
        if (!jsonObject || typeof jsonObject !== 'object')
            throw 'JSON object is not valid';
        if (propertyToCheck === '')
            return jsonObject;
        if (!isNaN(propertyToCheck))
            propertyToCheck = `$[${propertyToCheck}]`;

        const regex = /^\[(\d+)\]$/;
        const match = propertyToCheck.match(regex);
        if (match)
            propertyToCheck = `$[${match[1]}]`;

        const doesPropertyExist = await jsonata(`$exists(${propertyToCheck})`).evaluate(jsonObject);
        if (!doesPropertyExist)
            throw `JSON object does not have property '${propertyToCheck}'`;

        const result = jsonata(propertyToCheck).evaluate(jsonObject);
        return result;
    } catch (error) {
        throw error;
    }
}

async function get ( params ) {
    const client = await connect();
    const [key] = params.args;
    const value = await client.GET(key);
    console.log(value);
    await client.disconnect();
}

async function getjson ( params ) {
    const client = await connect();
    const [key, property] = params.args;
    const value = await client.GET(key);
    const jsonValue = await isValidJSONAndHasName(value, property);
    console.log(jsonValue);
    await client.disconnect();
}

async function set ( params ) {
    const client = await connect();
    const [key, value] = params.args;
    await client.SET(key, value);
    console.log({[key]: value});
    await client.disconnect();
}

async function incr ( params ) {
    const client = await connect();
    const [key] = params.args;
    const value = await client.INCR(key);
    console.log(value);
    await client.disconnect();
}

async function decr ( params ) {
    const client = await connect();
    const [key] = params.args;
    const value = await client.DECR(key);
    console.log(value);
    await client.disconnect();
}

async function del ( params ) {
    const client = await connect();
    const [key] = params.args;
    const value = await client.DEL(key);
    console.log(value);
    await client.disconnect();
}

async function flushdb () {
    const client = await connect();
    const value = await client.FLUSHDB();
    console.log(value);
    await client.disconnect();
}

async function ping () {
    const client = await connect();
    const value = await client.PING();
    console.log(value);
    await client.disconnect();
}

async function scan () {
    const client = await connect();
    const value = await client.SCAN(0);
    console.log(value);
    await client.disconnect();
}

async function commands_list () {
  const client = await connect();
  const commands = await client.COMMAND_LIST();
  const sorted_commands = commands.sort();
  sorted_commands.forEach((c) => {
    console.log(c);
  });
  await client.disconnect();
}

async function raw ( params ) {
    const client = await connect();
    const [commands] = params.args;
    const commandsArray = commands.split(' ');
    const value = await client.sendCommand(commandsArray);
    console.log(value);
    await client.disconnect();
}

module.exports = { get, getjson, set, incr, decr, del, flushdb, commands_list, ping, raw, scan };
