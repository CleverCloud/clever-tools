'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const Bacon = require('baconjs');

const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const { conf } = require('../models/configuration.js');

function ensureConfigDir () {
  const configDir = path.dirname(conf.CONFIGURATION_FILE);
  return Bacon.fromNodeCallback(mkdirp, configDir, { mode: 0o700 });
}

function writeConfig () {
  Logger.debug('Removing the tokens from the configuration file…');
  return ensureConfigDir().flatMapLatest(() => {
    return Bacon.fromNodeCallback(fs.writeFile, conf.CONFIGURATION_FILE, '');
  });
}

function logout (api, params) {

  const s_result = Bacon.once()
    .flatMapLatest(writeConfig)
    .map(() => Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`));

  // Force process exit, otherwhise, it will be kept alive
  // because of the spawn() call (in src/open-browser.js)
  handleCommandStream(s_result, () => process.exit(0));
}

module.exports = logout;
