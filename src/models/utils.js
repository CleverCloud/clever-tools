// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
/* global AbortController */
import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { Logger } from '../logger.js';

export class Deferred {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Check if a URL responds with a non-excluded HTTP status code for a given number of consecutive successes
 * @param {string} url - The URL to check
 * @param {number} [excludedStatus=404] - The HTTP status code to exclude
 * @param {number} [successCount=3] - The required number of consecutive successes
 * @param {number} [timeoutSeconds=30] - The maximum delay in seconds
 * @throws {Error} If the URL does not respond well within the timeout
 * @returns {Promise<number>} - The HTTP status code of the response
 */
export async function checkUrlStatus (url, excludedStatus = 404, successCount = 3, timeoutSeconds = 30) {
  Logger.debug(`Checking URL status: ${url}`);
  const controller = new AbortController();
  const timeout = timeoutSeconds * 1000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();
  let currentSuccessCount = 0;

  while (true) {
    try {
      const response = await fetch(url, { signal: controller.signal });
      Logger.debug(`Response status: ${response.status}`);
      if (response.status !== excludedStatus) {
        currentSuccessCount++;
        if (currentSuccessCount >= successCount) {
          clearTimeout(timeoutId);
          return response.status;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      else {
        currentSuccessCount = 0;
      }
    }
    catch (error) {
      if (error.name === 'AbortError') {
        Logger.error(`Timeout after ${timeoutSeconds} seconds, check was aborted`);
        process.exit(1);
      }
      else {
        Logger.error(error.message);
        process.exit(1);
      }
    }

    if (Date.now() - startTime >= timeout) {
      Logger.error(`Timeout after ${timeoutSeconds} seconds`);
      process.exit(1);
    }
  }
}

/**
 * Mask a token by replacing the middle part with asterisks
 * @param {string} token - The token to mask
 * @returns {string} - The masked token
 */
export function maskToken (token) {
  if (!token) {
    return null;
  }
  return token.slice(0, 3) + '***' + token.slice(-4);
}

/**
 * Generate a random string of a given length
 * @param {number} length - The length of the string to generate
 * @returns {string} - The generated string
 */
export function generateRandomString (length) {
  return crypto.randomBytes(length)
    .toString('hex')
    .slice(0, length);
}

/**
 * Make an HTTP request to an API
 * @param {Object} payload - The request payload
 * @param {string} payload.baseUrl - The base URL of the API
 * @param {string} payload.method - The HTTP method (GET, POST, DELETE, PATCH)
 * @param {string} payload.route - The API route to append to the base URL
 * @param {Object} [payload.body] - The request body (for POST/PATCH requests)
 * @param {Object} [payload.headers] - Additional headers to include
 * @param {boolean} [payload.returnRawResponse=false] - If true, returns the raw Response object instead of JSON
 * @param {string} [payload.errorPrefix='Operation'] - Prefix for error messages
 * @param {boolean} [payload.exitOnError=true] - Whether to exit process on error
 * @throws {Error} If the request fails
 * @returns {Promise<Object|Response>} The response data or raw Response object
 */
export async function makeRequest ({
  baseUrl,
  method,
  route,
  bearer,
  contentType = 'application/json',
  body = null,
  headers = {},
  returnRawResponse = false,
  errorPrefix = 'Operation',
  exitOnError = true,
}) {
  try {
    const requestOptions = {
      method,
      headers: {
        Authorization: bearer ? `Bearer ${bearer}` : '',
        'Content-Type': contentType,
        ...headers,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const url = `${baseUrl}${route}`;

    Logger.debug(`${method} request to: ${url}`);
    if (body) {
      Logger.debug('Request body:');
      Logger.debug(JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, requestOptions);

    if (returnRawResponse) {
      return response;
    }

    const data = response.body && (response.status === 200 || response.status === 201) ? await response.json() : {};

    Logger.debug('Response data:');
    Logger.debug(JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      const errorMessage = data.error_description || data['Otoroshi-Error'] || `${response.statusText} (${response.status})`;
      Logger.error(errorMessage);
      if (exitOnError) {
        process.exit(1);
      }
      throw new Error(errorMessage);
    }

    return data;
  }
  catch (error) {
    Logger.error(`${errorPrefix} failed: ${error.message}`);
    if (exitOnError) {
      process.exit(1);
    }
    throw error;
  }
}

export function truncateWithEllipsis (length, string) {
  if (string.length > length - 1) {
    return string.substring(0, length - 1) + '…';
  }
  return string;
}
