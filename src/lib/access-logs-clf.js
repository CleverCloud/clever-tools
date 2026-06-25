const CLF_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a `Date` as a Common Log Format timestamp in UTC, e.g. `10/Oct/2000:13:55:36 +0000`.
 * @param {Date} date
 * @returns {string}
 */
function formatClfDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getUTCDate());
  const month = CLF_MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0000`;
}

/**
 * Escape a value so it can be safely embedded inside a double-quoted CLF field.
 * Backslashes are escaped first, then double-quotes, otherwise a `"` would be escaped
 * twice. Without this, a `"` in the value would close the quoted field early and shift
 * every subsequent column.
 * @param {string} value
 * @returns {string}
 */
function escapeClfQuoted(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Format an HTTP access log as a Common Log Format line.
 *
 * The HTTP protocol version is absent from the v4 access log payload, so the request line is
 * limited to `method path` (no `HTTP/x.y` token). The protocol token is optional in CLF parsers
 * (grok, GoAccess), and emitting a `-` placeholder would actually break their structured parsing.
 *
 * @see https://en.wikipedia.org/wiki/Common_Log_Format
 * @param {object} log an HTTP access log (the `http` section must be present)
 * @returns {string}
 */
export function formatClf(log) {
  const host = log.source.ip;
  const ident = '-';
  const authuser = '-';
  const date = formatClfDate(log.date);
  const request = `${log.http.request.method} ${escapeClfQuoted(log.http.request.path)}`;
  const status = log.http.response.statusCode;
  const bytes = log.bytesOut;

  return `${host} ${ident} ${authuser} [${date}] "${request}" ${status} ${bytes}`;
}
