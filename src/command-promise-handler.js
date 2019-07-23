'use strict';

const _ = require('lodash');
const Logger = require('./logger.js');

function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(_.get(error, 'message', error));
    process.exit(1);
  });
}

module.exports = handleCommandPromise;
