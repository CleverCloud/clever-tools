// Dates are the one thing these functions do not put back: the client normalizes every date the v4
// drain API returns (`normalizeDate`), so only the resulting ISO string reaches the CLI and
// `--format json` keeps it.

/**
 * Inverse of `transformLogDrain` in
 * `@clevercloud/client/cc-api-commands/log-drain/log-drain-transform.js`.
 *
 * The `applicationId` / `addonId` the client mirrors back from the command input are dropped: the
 * payload never carried them.
 *
 * @param {import('@clevercloud/client/cc-api-commands/log-drain/log-drain.types.js').LogDrain} drain
 * @returns {import('./log-drain.legacy.types.js').LegacyLogDrain}
 */
export function toLegacyLogDrain(drain) {
  return {
    id: drain.id,
    kind: drain.kind,
    status: {
      status: drain.status,
      date: drain.updatedAt,
      // the transform turns the API's `null` into an absent key
      authorId: drain.updatedBy ?? null,
      errorReason: drain.errorReason ?? null,
    },
    recipient: toLegacyLogDrainRecipient(drain.target),
    execution: {
      status: drain.execution.status,
      lastError: drain.execution.lastError ?? null,
      attempt: drain.execution.attempt ?? null,
      maxAttempt: drain.execution.maxAttempt ?? null,
      lastAttemptAt: drain.execution.lastAttemptAt ?? null,
      nextAttemptAt: drain.execution.nextAttemptAt ?? null,
      retryingSince: drain.execution.retryingSince ?? null,
    },
    backlog: drain.backlog ?? null,
  };
}

/**
 * Inverse of `transformLogDrainTarget` in
 * `@clevercloud/client/cc-api-commands/log-drain/log-drain-transform.js`.
 *
 * The transform only reads the optional recipient fields when they are truthy, so an absent one
 * tells nothing about whether the API sent it as `null`, as an empty string, or not at all. They are
 * left out here rather than restored as `null`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/log-drain/log-drain.types.js').LogDrainTarget} target
 * @returns {import('./log-drain.legacy.types.js').LegacyLogDrainRecipient}
 */
function toLegacyLogDrainRecipient(target) {
  switch (target.type) {
    case 'RAW_HTTP':
      return {
        type: 'RAW_HTTP',
        url: target.url,
        ...(target.credentials != null && {
          username: target.credentials.username,
          password: target.credentials.password,
        }),
      };
    case 'SYSLOG_TCP':
    case 'SYSLOG_UDP':
      return {
        type: target.type,
        url: target.url,
        ...(target.rfc5424StructuredDataParameters != null && {
          rfc5424StructuredDataParameters: target.rfc5424StructuredDataParameters,
        }),
      };
    case 'OVH_TCP':
      return {
        type: 'OVH_TCP',
        url: target.url,
        ...(target.token != null && { token: target.token }),
        ...(target.rfc5424StructuredDataParameters != null && {
          rfc5424StructuredDataParameters: target.rfc5424StructuredDataParameters,
        }),
      };
    case 'DATADOG':
      return {
        type: 'DATADOG',
        url: target.url,
      };
    case 'ELASTICSEARCH':
      return {
        type: 'ELASTICSEARCH',
        url: target.url,
        ...(target.credentials != null && {
          username: target.credentials.username,
          password: target.credentials.password,
        }),
        ...(target.indexPrefix != null && { index: target.indexPrefix }),
        ...(target.tlsVerification != null && { tlsVerification: target.tlsVerification }),
      };
    case 'NEWRELIC':
      return {
        type: 'NEWRELIC',
        url: target.url,
        apiKey: target.apiKey,
      };
    case 'BETTERSTACK':
      return {
        type: 'BETTERSTACK',
        url: target.url,
        sourceToken: target.sourceToken,
      };
  }
}
