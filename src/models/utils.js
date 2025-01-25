import { Logger } from '../logger.js';
import openPage from 'open';

// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
export class Deferred {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Execute a command and display the result
 * @param {function} fn The function to execute
 * @param {array} params The parameters to pass to the function
 * @returns {Promise<void>} A promise that resolves when the command is executed
 * @throws {Error} If the command execution fails
 */
export async function executeCommand (fn, params) {
  try {
    const result = await fn(...params);
    Logger.println(result.message);
  }
  catch (e) {
    Logger.error(e.message);
  }
}

/**
 * Open a URL in the default browser
 * @param {string} url The URL to open
 * @param {string} message The message to display before opening the URL
 * @returns {Promise<void>} A promise that resolves when the URL is opened
 */
export async function openBrowser (url, message) {
  Logger.println(message);
  return openPage(url, { wait: false });
}

export function truncateWithEllipsis (length, string) {
  if (string.length > length - 1) {
    return string.substring(0, length - 1) + '…';
  }
  return string;
}
