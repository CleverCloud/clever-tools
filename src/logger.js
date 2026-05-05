import { getLogger, setup } from '@clevercloud/scribe';
import os from 'node:os';
import path from 'node:path';
import { format } from 'node:util';
import { ApiError } from './lib/api-error.js';
import { styleText } from './lib/style-text.js';

const IS_QUIET = Boolean(process.env.CLEVER_QUIET);
const IS_VERBOSE = Boolean(process.env.CLEVER_VERBOSE);

setup({
  file: {
    level: 'debug',
    path: getLogFilePath('clever-tools.log'),
    rotation: {
      size: '250k',
      maxFiles: 50,
    },
  },
});

const logger = getLogger();

export const Logger = {
  /**
   * @param {string} message
   */
  debug(message) {
    logger.debug(message);
    prettyLog('debug', message);
  },

  /**
   * @param {string} message
   */
  info(message) {
    logger.info(message);
    prettyLog('info', message);
  },

  /**
   * @param {string} message
   */
  warn(message) {
    logger.warn(message);
    prettyLog('warn', message);
  },

  /**
   * @param {Error|string} error
   */
  error(error) {
    logger.error(error);

    if (IS_QUIET) {
      return;
    }

    const prefix = '[ERROR] ';
    const styledPrefix = styleText(['bold', 'red'], prefix);
    const formatted = formatLines(prefix.length, processApiError(error));

    if (IS_VERBOSE && error instanceof Error) {
      writeStderr('[STACKTRACE]');
      writeStderr(error);
      writeStderr('[/STACKTRACE]');
    }
    writeStderr(`${styledPrefix}${formatted}`);
  },

  println: writeStdout,

  /**
   * @param {string} text
   * @param {number} indentLevel
   */
  printlnWithIndent(text, indentLevel) {
    writeStdout(' '.repeat(indentLevel) + text);
  },

  /** @param {string} message */
  printSuccess(message) {
    writeStdout(`${styleText(['bold', 'green'], '✓')} ${message}`);
  },

  /** @param {string} message */
  printInfo(message) {
    writeStdout(`${styleText('blue', 'i')} ${message}`);
  },

  /** @param {string} message */
  printWarning(message) {
    writeStdout(`${styleText('yellow', '⚠')} ${message}`);
  },

  /** @param {unknown} obj */
  printJson(obj) {
    writeStdout(JSON.stringify(obj, null, 2));
  },

  /** @param {any} obj */
  printTable(obj) {
    // eslint-disable-next-line no-console -- Logger.printTable is the sanctioned wrapper around console.table
    console.table(obj);
  },

  printErrorLine: writeStderr,
};

/**
 * Logs a message to the console with severity prefix.
 * @param {'debug'|'info'|'warn'} severity
 * @param {string} message
 * @returns {void}
 */
function prettyLog(severity, message) {
  if (IS_QUIET) {
    return;
  }
  if (!IS_VERBOSE) {
    return;
  }
  const prefix = `[${severity.toUpperCase()}] `;
  writeStdout(`${prefix}${formatLines(prefix.length, message)}`);
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
 * Writes a formatted line to stderr.
 * @param {string?} value
 * @returns {void}
 */
function writeStdout(value) {
  process.stdout.write(format(value) + '\n');
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

/**
 * Resolves the full path for a log file based on the operating system.
 * - Windows: `%LOCALAPPDATA%\clever-cloud\Logs\<logFile>`
 * - macOS: `~/Library/Logs/clever-cloud/<logFile>`
 * - Linux: `$XDG_STATE_HOME/clever-cloud/<logFile>` (defaults to `~/.local/state/clever-cloud/<logFile>`)
 * @param {string} logFile - The name of the log file
 * @returns {string} The absolute path to the log file
 */
function getLogFilePath(logFile) {
  if (process.platform === 'win32' && process.env.LOCALAPPDATA != null) {
    return path.resolve(process.env.LOCALAPPDATA, 'clever-cloud', 'Logs', logFile);
  }
  if (process.platform === 'darwin') {
    return path.resolve(os.homedir(), 'Library', 'Logs', 'clever-cloud', logFile);
  }
  const xdgStateHome = process.env.XDG_STATE_HOME ?? path.resolve(os.homedir(), '.local', 'state');
  return path.resolve(xdgStateHome, 'clever-cloud', logFile);
}
