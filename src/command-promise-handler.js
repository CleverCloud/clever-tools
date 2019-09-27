'use strict';

const _ = require('lodash');
const Logger = require('./logger.js');

function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(error);
    process.exit(1);
  });
}

module.exports = handleCommandPromise;
