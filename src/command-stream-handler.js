'use strict';

const _ = require('lodash');
const Logger = require('./logger.js');

function handleCommandStream (stream, onValue = _.noop) {
  stream.onValue(onValue);
  stream.onError((error) => {
    Logger.error(_.get(error, 'message', error));
    process.exit(1);
  });
}

module.exports = handleCommandStream;
