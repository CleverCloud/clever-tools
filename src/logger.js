'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

function getPrefix (severity) {
  const prefix = `[${severity.toUpperCase()}] `;
  const prefixLength = prefix.length;
  if (severity === 'error') {
    return { prefix: colors.bold.red(prefix), prefixLength };
  }
  return { prefix, prefixLength };
}

function processApiError (error) {
  if (error.id == null || error.message == null) {
    return error;
  }
  const fields = _.map(error.fields, (msg, field) => `${field}: ${msg}`);
  return [`${error.message} [${error.id}]`, ...fields].join('\n');
};

function formatLines (prefixLength, lines) {
  const blankPrefix = _.repeat(' ', prefixLength);
  return (lines || '')
    .split('\n')
    .map((line, i) => (i === 0) ? line : `${blankPrefix}${line}`)
    .join('\n');
}

const Logger = _(['debug', 'info', 'warn', 'error'])
  .map((severity) => {
    if (process.env.CLEVER_QUIET || (!process.env.CLEVER_VERBOSE && (severity === 'debug' || severity === 'info'))) {
      return [severity, _.noop];
    }
    const consoleFn = (severity === 'error') ? console.error : console.log;
    const { prefix, prefixLength } = getPrefix(severity);
    return [severity, (err) => {
      const message = _.get(err, 'message', err);
      const formattedMsg = formatLines(prefixLength, processApiError(message));
      if (process.env.CLEVER_VERBOSE && severity === 'error') {
        console.error('[STACKTRACE]');
        console.error(err);
        console.error('[/STACKTRACE]');
      }
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
