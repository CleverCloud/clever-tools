import * as Application from './application.js';
import { resolveAddon } from './ids-resolver.js';

/**
 * Resolves the resource (application or add-on) a drain command applies to.
 * Returns an object ready to be spread into a log drain command input:
 * `{ ownerId, addonId }` (real add-on id) or `{ ownerId, applicationId }`.
 */
export async function resolveDrainResource(alias, appIdOrName, addonIdOrRealId) {
  if (addonIdOrRealId != null && (appIdOrName != null || alias != null)) {
    throw new Error('`--addon` cannot be combined with `--app` or `--alias`');
  }

  if (addonIdOrRealId != null) {
    const { ownerId, realId } = await resolveAddon(addonIdOrRealId);
    return { ownerId, addonId: realId };
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  return { ownerId, applicationId: appId };
}

export const DRAIN_TYPES = {
  BETTERSTACK: { apiCode: 'BETTERSTACK', cliCode: 'betterstack', label: 'Better Stack' },
  DATADOG: { apiCode: 'DATADOG', cliCode: 'datadog', label: 'Datadog' },
  ELASTICSEARCH: { apiCode: 'ELASTICSEARCH', cliCode: 'elasticsearch', label: 'Elasticsearch' },
  NEWRELIC: { apiCode: 'NEWRELIC', cliCode: 'newrelic', label: 'New Relic' },
  OVH_TCP: { apiCode: 'OVH_TCP', cliCode: 'ovh-tcp', label: 'OVH TCP' },
  RAW_HTTP: { apiCode: 'RAW_HTTP', cliCode: 'raw-http', label: 'Raw HTTP' },
  SYSLOG_TCP: { apiCode: 'SYSLOG_TCP', cliCode: 'syslog-tcp', label: 'Syslog TCP' },
  SYSLOG_UDP: { apiCode: 'SYSLOG_UDP', cliCode: 'syslog-udp', label: 'Syslog UDP' },
};

export const DRAIN_TYPE_CLI_CODES = Object.values(DRAIN_TYPES).map(({ cliCode }) => cliCode);

function formatRate(messagesPerSecond) {
  if (messagesPerSecond < 1) {
    return Math.floor(messagesPerSecond * 3600) + ' messages/hour';
  }
  if (messagesPerSecond < 60) {
    return Math.floor(messagesPerSecond * 60) + ' messages/minute';
  }
  return Math.floor(messagesPerSecond) + ' messages/second';
}

function formatThroughput(bytesPerSecond) {
  if (bytesPerSecond < 1024) {
    return Math.floor(bytesPerSecond) + ' bytes/second';
  }
  if (bytesPerSecond < 1024 * 1024) {
    return (bytesPerSecond / 1024).toFixed(2) + ' KiB/second';
  }
  return (bytesPerSecond / (1024 * 1024)).toFixed(2) + ' MiB/second';
}

/**
 * Formats a log drain (as returned by the `cc-api` log drain commands) for `console.table` display.
 * @param {import('@clevercloud/client/cc-api-commands/log-drain/log-drain.types.js').LogDrain} drain
 */
export function formatDrain(drain) {
  const drainType = DRAIN_TYPES[drain.target.type];
  // `execution` and `backlog` carry more runtime fields than their declared types
  const execution = /** @type {Record<string, any>} */ (drain.execution);
  const backlog = /** @type {Record<string, any>} */ (drain.backlog);
  const drainDetails = [
    ['ID', drain.id],
    ['Status', drain.status],
    ['Execution status', execution.status],
    ['URL', drain.target.url],
    ['Type', drainType.label],
    ['Custom index', 'indexPrefix' in drain.target ? drain.target.indexPrefix : null],
    [
      'SD parameters',
      'rfc5424StructuredDataParameters' in drain.target ? drain.target.rfc5424StructuredDataParameters : null,
    ],
    ['Message output rate', formatRate(backlog.msgRateOut)],
    ['Message throughput', formatThroughput(backlog.msgThroughputOut)],
    ['Backlog', backlog.msgBacklog + ' pending messages'],
    [
      'Retry attempts',
      execution.attempt != null && execution.maxAttempt != null ? `${execution.attempt}/${execution.maxAttempt}` : null,
    ],
    ['Last attempt at', execution.lastAttemptAt],
    ['Next attempt at', execution.nextAttemptAt],
    ['Retrying since', execution.retryingSince],
    ['Last error', execution.lastError],
  ];
  return Object.fromEntries(drainDetails.filter(([_name, value]) => value != null));
}
