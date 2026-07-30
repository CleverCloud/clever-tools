// Not put back: the access logs of a TCP redirection or an SSH session. The client's
// `transformApplicationAccessLog` answers `undefined` for anything that is not HTTP and the stream
// skips those, so they never reach the CLI — `clever accesslogs` used to emit them.

/**
 * Inverse of `transformApplicationRuntimeLog` and `transformAddonRuntimeLog` in
 * `@clevercloud/client/cc-api-commands/log/log-transform.js`, dispatching on the kind of log the
 * stream delivered.
 *
 * @param {import('@clevercloud/client/cc-api-commands/log/log.types.js').ApplicationRuntimeLog
 *   | import('@clevercloud/client/cc-api-commands/log/log.types.js').AddonRuntimeLog} log
 * @returns {import('./log.legacy.types.js').LegacyApplicationRuntimeLog
 *   | import('./log.legacy.types.js').LegacyAddonRuntimeLog}
 */
export function toLegacyRuntimeLog(log) {
  return 'addonId' in log ? toLegacyAddonRuntimeLog(log) : toLegacyApplicationRuntimeLog(log);
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/log/log.types.js').ApplicationRuntimeLog} log
 * @returns {import('./log.legacy.types.js').LegacyApplicationRuntimeLog}
 */
function toLegacyApplicationRuntimeLog(log) {
  return {
    id: log.id,
    applicationId: log.applicationId,
    commitId: log.commitId,
    deploymentId: log.deploymentId,
    instanceId: log.instanceId,
    date: log.date,
    // the transform turns the API's `unknown` region into an absent key
    region: log.region ?? 'unknown',
    zone: log.zone,
    pid: log.pid,
    facility: log.facility,
    severity: log.severity,
    priority: log.priority,
    version: log.version,
    service: log.service,
    message: log.message,
  };
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/log/log.types.js').AddonRuntimeLog} log
 * @returns {import('./log.legacy.types.js').LegacyAddonRuntimeLog}
 */
function toLegacyAddonRuntimeLog(log) {
  return {
    id: log.id,
    resourceId: log.addonId,
    hostname: log.hostname,
    instanceId: log.instanceId,
    date: log.date,
    // the transform turns the API's `null` into an absent key
    region: log.region ?? null,
    zone: log.zone,
    pid: log.pid,
    facility: log.facility,
    severity: log.severity,
    service: log.service,
    message: log.message,
  };
}

/**
 * Inverse of `transformApplicationAccessLog` in
 * `@clevercloud/client/cc-api-commands/log/log-transform.js`.
 *
 * `region`, `tls` and `response.serviceTime` are restored to the values `AccessLogView` hardcodes
 * them to — an empty string for the first, `null` for the other two — which is what every access log
 * the API has ever served carries.
 *
 * @param {import('@clevercloud/client/cc-api-commands/log/log.types.js').ApplicationAccessLog} log
 * @returns {import('./log.legacy.types.js').LegacyApplicationAccessLog}
 */
export function toLegacyApplicationAccessLog(log) {
  return {
    id: log.id,
    date: log.date,
    applicationId: log.applicationId,
    instanceId: log.instanceId,
    requestId: log.requestId,
    bytesIn: log.bytesIn,
    bytesOut: log.bytesOut,
    source: log.source,
    destination: log.destination,
    tls: log.tls ?? null,
    zone: log.zone,
    region: '',
    http: {
      request: log.detail.request,
      response: {
        statusCode: log.detail.response.statusCode,
        time: log.detail.response.time,
        serviceTime: null,
      },
    },
  };
}
