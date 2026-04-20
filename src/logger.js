import { format } from 'node:util';
import { ApiError } from './lib/api-error.js';
import { styleText } from './lib/style-text.js';

const IS_QUIET = Boolean(process.env.CLEVER_QUIET);
const IS_VERBOSE = Boolean(process.env.CLEVER_VERBOSE);

export const Logger = {
  /**
   * @param {string} message
   */
  debug(message) {
    consoleLog('debug', message);
  },

  /**
   * @param {string} message
   */
  info(message) {
    consoleLog('info', message);
  },

  /**
   * @param {string} message
   */
  warn(message) {
    consoleLog('warn', message);
  },

  /**
   * @param {Error|string} error
   */
  error(error) {
    if (IS_QUIET) {
      return;
    }

    const prefix = '[ERROR] ';
    const styledPrefix = styleText(['bold', 'red'], prefix);
    const formatted = formatLines(prefix.length, processApiError(error));

    if (IS_VERBOSE) {
      writeStderr('[STACKTRACE]');
      writeStderr(error);
      writeStderr('[/STACKTRACE]');
    }
    writeStderr(`${styledPrefix}${formatted}`);
  },

  println: console.log,

  /**
   * @param {string} text
   * @param {number} indentLevel
   */
  printlnWithIndent(text, indentLevel) {
    console.log(' '.repeat(indentLevel) + text);
  },

  /** @param {string} message */
  printSuccess(message) {
    console.log(`${styleText(['bold', 'green'], '✓')} ${message}`);
  },

  /** @param {string} message */
  printInfo(message) {
    console.log(`${styleText('blue', 'i')} ${message}`);
  },

  /** @param {unknown} obj */
  printJson(obj) {
    console.log(JSON.stringify(obj, null, 2));
  },

  printErrorLine: writeStderr,
};

/**
 * Logs a message to the console with severity prefix.
 * @param {'debug'|'info'|'warn'} severity
 * @param {string} message
 * @returns {void}
 */
function consoleLog(severity, message) {
  if (IS_QUIET) {
    return;
  }
  if (!IS_VERBOSE && severity !== 'warn') {
    return;
  }
  const prefix = `[${severity.toUpperCase()}] `;
  console.log(`${prefix}${formatLines(prefix.length, message)}`);
}

/**
 * Writes a formatted line to stderr.
 * @param {Error|string} value
 * @returns {void}
 */
function writeStderr(value) {
  process.stderr.write(format(value) + '\n');
}

/**
 * Formats a multiline message with indentation for continuation lines.
 * @param {number} prefixLength
 * @param {string} message
 * @returns {string}
 */
function formatLines(prefixLength, message) {
  const indent = ' '.repeat(prefixLength);
  return message
    .split('\n')
    .map((line, i) => (i === 0 ? line : indent + line))
    .join('\n');
}

/**
 * Transforms an API error object into a formatted message string.
 * @param {Error|string} error
 * @returns {string}
 */
function processApiError(error) {
  if (error instanceof ApiError) {
    return `${error.message} [${error.code}]`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}
