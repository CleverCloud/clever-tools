import { getLogger, setup } from '@clevercloud/scribe';
import os from 'node:os';
import path from 'node:path';
import { format } from 'node:util';
import { styleText } from './lib/style-text.js';

const IS_QUIET = Boolean(process.env.CLEVER_QUIET);
const IS_VERBOSE = Boolean(process.env.CLEVER_VERBOSE);

setup({
  stdio: IS_QUIET
    ? undefined
    : {
        level: IS_VERBOSE ? 'debug' : 'info',
        pretty: true,
      },
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
  },

  /**
   * @param {string} message
   */
  info(message) {
    logger.info(message);
  },

  /**
   * @param {string} message
   */
  warn(message) {
    logger.warn(message);
  },

  /**
   * @param {Error|string} error
   */
  error(error) {
    const message = error instanceof Error ? error.message : error;
    if (IS_VERBOSE && error instanceof Error) {
      logger.error(error);
    } else {
      logger.error(message);
    }
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

  /** @param {unknown} obj */
  printJson(obj) {
    writeStdout(JSON.stringify(obj, null, 2));
  },

  printErrorLine: writeStderr,
};

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
