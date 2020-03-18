'use strict';

const _ = require('lodash');
const Logger = require('./logger.js');
const pkg = require('../package.json');
const semver = require('semver');

function handleCommandStream (stream) {
  stream.onValue(_.noop);
  stream.onError((error) => {
    Logger.error(error);
    const semverIsOk = semver.satisfies(process.version, pkg.engines.node);
    if (!semverIsOk) {
      Logger.warn(`You are using node ${process.version}, some of our commands require node ${pkg.engines.node}. The error may be caused by this.`);
    }
    process.exit(1);
  });
  // explicit exit FTW
  stream.onEnd(() => process.exit(0));
}

module.exports = handleCommandStream;
