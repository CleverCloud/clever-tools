'use strict';

const Logger = require('./logger.js');
const pkg = require('../package.json');
const semver = require('semver');

function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(error);
    const semverIsOk = semver.satisfies(process.version, pkg.engines.node);
    if (!semverIsOk) {
      Logger.warn(`You are using node ${process.version}, some of our commands require node ${pkg.engines.node}. The error may be caused by this.`);
    }
    process.exit(1);
  });
}

module.exports = { handleCommandPromise };
