'use strict';

const Logger = require('../logger.js');
const { version: package_version } = require('../../package');

function version () {
  Logger.println(package_version);
}

module.exports = version;
