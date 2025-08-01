/**
 * Utility functions for handling date and time formatting.
 * Provides functions to convert date strings to local date and time formats.
 * @param {string} dateString - The date string to convert, in ISO format.
 * @return {[string, string]} - An array containing the formatted date and time strings.
 * The first element is the date in 'YYYY-MM-DD' format, and the second is the time in 'HH:MM' format.
 */
export function getLocalDateAndTime(dateString) {
  const date = new Date(dateString);

  const rawDatetimeParts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const d = Object.fromEntries(
    rawDatetimeParts
      .filter((entry) => entry.type !== 'literal')
      .map((entry) => {
        return [entry.type, entry.value];
      }),
  );

  const dateStr = `${d.year}-${d.month}-${d.day}`;
  const timeStr = `${d.hour}:${d.minute}`;

  return [dateStr, timeStr];
}
