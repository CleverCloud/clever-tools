import { Polling } from '../../src/utils/polling.js';
import { sleep } from './timers.js';

/**
 * Retries a function until it returns a non-null value or timeout is reached, or max retries is reached.
 *
 * @param {() => T|Promise<T>} fn - The function to retry. Should return a non-null value on success or null/undefined to retry.
 * @param {object} options - Retry configuration options.
 * @param {number} options.interval - Time in milliseconds between retry attempts.
 * @param {number} options.timeout - Maximum time in milliseconds before giving up.
 * @param {number} [options.maxRetries] - Maximum number of retry attempts. If not specified, retries until timeout.
 * @param {number} [options.delay] - Initial delay in milliseconds before starting the first attempt.
 * @returns {Promise<T>} A promise that resolves with the function's return value or rejects on timeout.
 * @template T
 */
export async function retry(fn, { interval, timeout, maxRetries, delay }) {
  if (delay != null && delay > 0) {
    await sleep(delay);
  }
  let retryCount = 0;
  const pollingWithTimeout = new Polling(
    async () => {
      if (maxRetries != null && maxRetries > 0 && retryCount > maxRetries) {
        throw new Error(`Retry limit reached (${maxRetries})`);
      }
      retryCount++;
      try {
        const value = await fn();
        if (value == null) {
          return { stop: false };
        }
        return { stop: true, value: value };
      } catch {
        return { stop: false };
      }
    },
    interval,
    timeout,
  );
  return pollingWithTimeout.start();
}
