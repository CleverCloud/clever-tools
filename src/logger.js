import _ from 'lodash';
import colors from 'colors/safe.js';
import { format } from 'node:util';

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

function consoleErrorWithoutColor (line) {
  process.stderr.write(format(line) + '\n');
}

export const Logger = _(['debug', 'info', 'warn', 'error'])
  .map((severity) => {
    if (process.env.CLEVER_QUIET || (!process.env.CLEVER_VERBOSE && (severity === 'debug' || severity === 'info'))) {
      return [severity, _.noop];
    }
    const consoleFn = (severity === 'error') ? consoleErrorWithoutColor : console.log;
    const { prefix, prefixLength } = getPrefix(severity);
    return [severity, (err) => {
      const message = _.get(err, 'message', err);
      const formattedMsg = formatLines(prefixLength, processApiError(message));
      if (process.env.CLEVER_VERBOSE && severity === 'error') {
        consoleErrorWithoutColor('[STACKTRACE]');
        consoleErrorWithoutColor(err);
        consoleErrorWithoutColor('[/STACKTRACE]');
      }
      return consoleFn(`${prefix}${formattedMsg}`);
    }];
  })
  .fromPairs()
  .value();

// No decoration for Logger.println
Logger.println = console.log;

// Logger for success with a green check before the message
Logger.printSuccess = (message) => console.log(`${colors.bold.green('✓')} ${message}`);

// No decoration for Logger.println
Logger.printJson = (obj) => {
  console.log(JSON.stringify(obj, null, 2));
};

Logger.printErrorLine = consoleErrorWithoutColor;

// Only exported for testing, shouldn't be used directly
Logger.processApiError = processApiError;
