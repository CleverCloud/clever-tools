'use strict';

const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const { conf, writeOAuthConf } = require('../models/configuration.js');

function logout () {

  // write empty object
  const s_result = writeOAuthConf({})
    .map(() => Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`));

  handleCommandStream(s_result);
}

module.exports = logout;
