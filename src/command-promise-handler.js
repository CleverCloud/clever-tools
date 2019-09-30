'use strict';

const Logger = require('./logger.js');

function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(error);
    process.exit(1);
  });
}

module.exports = handleCommandPromise;
