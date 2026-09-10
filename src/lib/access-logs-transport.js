/**
 * Transport used by the connection an access log describes.
 * @typedef {'HTTP'|'TCP'|'SSH'} AccessLogTransport
 */

/**
 * Guess the transport of an access log.
 *
 * The v4 access log payload has no explicit transport field yet, so it is inferred from the
 * sections the API did send:
 *
 * - an `http` section is only emitted for connections that went through the HTTP reverse proxy,
 * - TCP redirections go through the TCP proxy, which assigns a `requestId` but no `http` section,
 * - direct SSH connections to the instance go through neither, so they carry neither field.
 *
 * Drop this function once the API exposes the transport itself.
 *
 * @param {object} log an access log, as emitted by `ApplicationAccessLogStream`
 * @returns {AccessLogTransport}
 */
export function guessAccessLogTransport(log) {
  if (log.http != null) {
    return 'HTTP';
  }
  if (log.requestId != null) {
    return 'TCP';
  }
  return 'SSH';
}
