'use strict';

const Logger = require('../logger.js');
const { conf, writeOAuthConf } = require('../models/configuration.js');

async function logout () {
  // write empty object
  await writeOAuthConf({});
  Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
}

module.exports = { logout };
