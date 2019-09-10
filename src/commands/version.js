'use strict';

const Logger = require('../logger.js');
const pkg = require('../../package.json');

async function version () {
  Logger.println(pkg.version);
}

module.exports = { version };
