import openPage from 'open';
import { Logger } from '../logger.js';
import { conf } from './configuration.js';

// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Open an absolute URL or a console path in the default browser
 * @param {string} urlOrPath The URL to open
 * @param {string} message The message to display before opening the URL
 * @returns {Promise<void>} A promise that resolves when the URL is opened
 */
export function openBrowser(urlOrPath, message) {
  const url = urlOrPath.startsWith('/') ? `${conf.CONSOLE_URL}${urlOrPath}` : urlOrPath;

  Logger.debug(`Opening URL "${url}" in browser`);
  Logger.println(message);

  return openPage(url, { wait: false });
}

export function truncateWithEllipsis(length, string) {
  if (string.length > length - 1) {
    return string.substring(0, length - 1) + '…';
  }
  return string;
}
