/**
 * Formats a date to ISO-like format "YYYY-MM-DD HH:mm".
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  return new Date(dateInput).toISOString().substring(0, 16).replace('T', ' ');
}

/**
 * Formats a date to localized display format (e.g. "Feb 5, 2027, 14:16 UTC").
 * Returns undefined when the input is nullish.
 * @param {Date | undefined | null} date
 * @returns {string | undefined}
 */
export function formatDateLocalized(date) {
  if (date == null) {
    return undefined;
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

/**
 * Safely converts various date inputs (ISO string, timestamp, Date) to a Date instance.
 * Returns undefined for null/undefined or invalid values.
 * @param {string | number | Date | undefined | null} dateInput
 * @returns {Date | undefined}
 */
export function toDate(dateInput) {
  if (dateInput == null) {
    return undefined;
  }
  try {
    const date = new Date(dateInput);
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}
