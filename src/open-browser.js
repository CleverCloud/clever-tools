'use strict';

const Bacon = require('baconjs');
const opn = require('opn');

const Logger = require('./logger.js');

function openPage (url) {
  Logger.debug('Opening browser');
  return Bacon.fromPromise(opn(url, { wait: false }));
}

module.exports = { openPage };
