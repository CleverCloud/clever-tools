/**
 * @param {number} delay
 * @returns {Promise<void>}
 */
export function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}
