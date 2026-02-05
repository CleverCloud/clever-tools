/**
 * Formats a date to ISO-like format "YYYY-MM-DD HH:mm".
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  return new Date(dateInput).toISOString().substring(0, 16).replace('T', ' ');
}
