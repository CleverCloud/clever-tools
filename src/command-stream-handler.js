'use strict';

const _ = require('lodash');
const Logger = require('./logger.js');

function handleCommandStream (stream) {
  stream.onValue(_.noop);
  stream.onError((error) => {
    Logger.error(_.get(error, 'message', error));
    process.exit(1);
  });
  // explicit exit FTW
  stream.onEnd(() => process.exit(0));
}

module.exports = handleCommandStream;
