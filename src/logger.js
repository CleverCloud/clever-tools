'use strict';

const _ = require('lodash');

function getPrefix (severity) {
  return `[${severity.toUpperCase()}] `;
}

function processApiError (error) {
  if (error.id == null || error.message == null) {
    return error;
  }
  const fields = _.map(error.fields, (msg, field) => `${field}: ${msg}`);
  return [`${error.message} [${error.id}]`, ...fields].join('\n');
};

const Logger = _(['debug', 'info', 'warn', 'error'])
  .map((severity) => {
    if (process.env['CLEVER_QUIET'] || !process.env['CLEVER_VERBOSE'] && (severity === 'debug' || severity === 'info')) {
      return [severity, _.noop];
    }
    const consoleFn = (severity === 'error') ? console.error : console.log;
    const prefix = getPrefix(severity);
    return [severity, (message) => {
      const formattedMsg = processApiError(message);
      return consoleFn(`${prefix}${formattedMsg}`);
    }];
  })
  .fromPairs()
  .value();

// No decoration for Logger.println
Logger.println = console.log;

// No decoration for Logger.printErrorLine
Logger.printErrorLine = console.error;

// Only exported for testing, shouldn't be used directly
Logger.processApiError = processApiError;

module.exports = Logger;
