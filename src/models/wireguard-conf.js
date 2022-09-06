'use strict';

const os = require('os');
const { promises: fs, existsSync } = require('fs');
const path = require('path');

const Logger = require('../logger.js');
const Formatter = require('./format-string.js');

function getWgConfFolder () {
  // TODO: See if we can use runtime dirs
  return path.join(os.tmpdir(), 'com.clever-cloud.networkgroups');
}

async function createWgConfFolderIfNeeded () {
  const confFolder = getWgConfFolder();
  if (!existsSync(confFolder)) {
    await fs.mkdir(confFolder);
  }
}

function getWgConfInformation (ngId) {
  const confName = `wgcc${ngId.slice(-8)}`;
  const confPath = path.join(getWgConfFolder(), `${confName}.conf`);

  return { confName, confPath };
}

function getPeerIdPath (confName) {
  return path.join(getWgConfFolder(), `${confName}.id`);
}

async function storePeerId (peerId, confName) {
  const filePath = getPeerIdPath(confName);

  try {
    await fs.writeFile(filePath, peerId, { mode: 0o600, flag: 'wx' });
    Logger.info(`Saved peer ID file to ${Formatter.formatUrl(filePath)}`);
  }
  catch (error) {
    throw new Error(`Error saving peer ID: ${error}`);
  }
}

async function getPeerId (ngId) {
  const { confName } = getWgConfInformation(ngId);
  const filePath = getPeerIdPath(confName);
  if (existsSync(filePath)) {
    Logger.debug(`Reading peer ID from ${Formatter.formatUrl(filePath)}`);
    return (await fs.readFile(filePath, { encoding: 'utf-8' })).trim();
  }
  else {
    Logger.debug(`No file found at ${Formatter.formatUrl(filePath)}`);
    return null;
  }
}

async function deletePeerIdFile (ngId) {
  const { confName } = getWgConfInformation(ngId);
  const filePath = getPeerIdPath(confName);
  // We need `force: true` to avoid errors if file doesn't exist
  await fs.rm(filePath, { force: true });
  Logger.info(`Deleted peer ID from ${Formatter.formatUrl(filePath)}`);
}

async function getInterfaceName (confName) {
  // This file is created by WireGuard®, hence the file path (`/var/run/…`)
  // TODO: Handle Windows (not yet supported by `wg-quick` anyway)
  const interfaceNameFile = path.join('/var', 'run', 'wireguard', `${confName}.name`);

  Logger.debug(`Reading WireGuard® interface name in ${Formatter.formatUrl(interfaceNameFile)}…`);
  const interfaceName = (await fs.readFile(interfaceNameFile, { encoding: 'utf-8' })).trim();
  Logger.debug(`Found WireGuard® interface name ${Formatter.formatString(interfaceName)} for ${Formatter.formatString(confName)}`);
  return interfaceName;
}

function confWithoutPlaceholders (conf, { privateKey }) {
  conf = conf.replace('<%PrivateKey%>', privateKey);

  // TODO: This just removes leading and trailing new lines in the configuration file
  //       It should be better formatted on the API's side
  conf = conf.trim();

  return conf;
}

module.exports = {
  createWgConfFolderIfNeeded,
  getWgConfInformation,
  storePeerId,
  getPeerId,
  deletePeerIdFile,
  getInterfaceName,
  confWithoutPlaceholders,
};
