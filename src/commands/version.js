'use strict';

const Logger = require('../logger.js');
const { getPackageJson } = require('../load-package-json.js');

const pkg = getPackageJson();

async function version () {
  Logger.println(pkg.version);
}

module.exports = { version };
