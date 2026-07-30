/**
 * Turns an ISO date string back into the epoch milliseconds the API answers with.
 *
 * The client normalizes every date it returns to an ISO string (`normalizeDate`), so a command that
 * printed a numeric timestamp before the migration converts it back here.
 *
 * @param {string} isoDate
 * @returns {number}
 */
export function toEpochMs(isoDate) {
  return new Date(isoDate).getTime();
}
