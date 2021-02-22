'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

const Logger = require('../../logger.js');
const Formatter = require('./format-string.js');

function getWgConfFolder () {
  // TODO: See if we can use runtime dirs
  return path.join(os.tmpdir(), 'com.clever-cloud.networkgroups');
}

function createWgConfFolderIfNeeded () {
  const confFolder = getWgConfFolder();
  if (!fs.existsSync(confFolder)) {
    fs.mkdirSync(confFolder);
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

function storePeerId (peerId, confName) {
  const filePath = getPeerIdPath(confName);
  fs.writeFileSync(filePath, peerId, { mode: 0o600, flag: 'wx' }, (error) => {
    if (error) {
      Logger.error(`Error saving peer ID: ${error}`);
      process.exit(1);
    }
    else {
      Logger.info(`Saved peer ID file to ${Formatter.formatUrl(filePath)}`);
    }
  });
}

function getPeerId (ngId) {
  const { confName } = getWgConfInformation(ngId);
  const filePath = getPeerIdPath(confName);
  if (fs.existsSync(filePath)) {
    Logger.debug(`Reading peer ID from ${Formatter.formatUrl(filePath)}`);
    return fs.readFileSync(filePath, { encoding: 'utf-8' }).trim();
  }
  else {
    Logger.debug(`No file found at ${Formatter.formatUrl(filePath)}`);
    return null;
  }
}

function deletePeerIdFile (ngId) {
  const { confName } = getWgConfInformation(ngId);
  const filePath = getPeerIdPath(confName);
  // We need `force: true` to avoid errors if file doesn't exist
  fs.rmSync(filePath, { force: true });
  Logger.info(`Deleted peer ID from ${Formatter.formatUrl(filePath)}`);
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
  confWithoutPlaceholders,
};
