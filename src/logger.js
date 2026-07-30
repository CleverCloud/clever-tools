import { isCcHttpErrorWithStatus, isNetworkError } from '@clevercloud/client/utils/error-utils.js';
import { format } from 'node:util';
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
    const formatted = formatLines(prefix.length, getErrorMessage(error));

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
 * Extracts the message to display for an error.
 *
 * The low-level failures every command shares — an expired session, an unreachable API — are
 * translated here rather than closer to the client, so that the code in between keeps seeing the
 * client's own errors and can still branch on them (see the retry in `models/deployments.js`).
 *
 * Everything else is shown as the error words it. For an HTTP error that is the message
 * @clevercloud/client already built from the response: it reads the body the API really sent, which
 * is more than it looks — a JSON document a backend announced as `text/plain`, a play-json
 * validation failure flattened to the fields at fault, an HTML gateway page reported as the bare
 * status it means rather than dumped whole.
 * @param {Error|string} error
 * @returns {string}
 */
function getErrorMessage(error) {
  if (isCcHttpErrorWithStatus(error, 401)) {
    return `You're not logged in, use ${styleText('red', 'clever login')} command to connect to your Clever Cloud account`;
  }
  if (isNetworkError(error)) {
    return getNetworkErrorMessage(error.networkCode);
  }
  return error instanceof Error ? error.message : error;
}

/**
 * Words a network error according to the failure the platform reported.
 * `null` is what a browser gives, and what a runtime we haven't met yet may give too.
 * @param {import('@clevercloud/client/utils/error-utils.js').NetworkErrorCode|null} networkCode
 * @returns {string}
 */
function getNetworkErrorMessage(networkCode) {
  switch (networkCode) {
    // The host name did not resolve. EAI_AGAIN clears on its own and the other two do not, but from
    // here there is nothing to do about either.
    case 'EAI_AGAIN':
    case 'EAI_FAIL':
    case 'ENOTFOUND':
      return 'Cannot reach the Clever Cloud API, please check your internet connection.';

    // The host is not a name that can be resolved at all, so the URL we were given is malformed.
    case 'EAI_NONAME':
      return 'The Clever Cloud API URL has no valid host name, please check your configuration.';

    // This machine has no way out: no interface up, no route, or no local address left to send from.
    case 'EADDRNOTAVAIL':
    case 'ENETDOWN':
    case 'ENETUNREACH':
      return 'This machine has no network access to the Clever Cloud API, please check your network configuration.';

    // The connection never left this machine: something local filters outgoing connections.
    case 'ECONNABORTED':
      return 'The connection to the Clever Cloud API was blocked, please check your firewall configuration.';

    // The API was reached and is not answering. Nothing to do but wait for it to come back.
    case 'EHOSTDOWN':
    case 'EHOSTUNREACH':
      return 'The Clever Cloud API is unreachable, please try again.';
    case 'ECONNREFUSED':
      return 'The Clever Cloud API refused the connection, please try again.';

    // The connection was established and the TLS handshake failed on certificate verification: the
    // host is reachable, its identity is what could not be trusted. Whatever the exact failure, the
    // way out is the same — trust the authority that signed what the API is presenting.
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
    case 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      return `TLS certificate verification failed (${networkCode}). If you're behind a corporate proxy or using a private/self-signed Certificate Authority, trust your CA and follow the "TLS certificates" section of the documentation.`;

    // The connection died mid-exchange, so we don't know how far the request got.
    case 'ECONNRESET':
    case 'ENETRESET':
    case 'EPIPE':
    case 'ERR_STREAM_PREMATURE_CLOSE':
    case 'UND_ERR_SOCKET':
      return 'The connection to the Clever Cloud API was closed abruptly, please try again.';

    // Nothing came back in time.
    case 'ETIMEDOUT':
    case 'UND_ERR_CONNECT_TIMEOUT':
      return 'The connection to the Clever Cloud API timed out, please try again.';

    // The API did answer, then stopped: it got the request, so trying again may run it twice.
    case 'UND_ERR_BODY_TIMEOUT':
    case 'UND_ERR_HEADERS_TIMEOUT':
      return 'The Clever Cloud API received the request but did not finish answering in time.';

    default:
      return 'Cannot reach the Clever Cloud API, please check your internet connection.';
  }
}
