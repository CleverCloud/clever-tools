import { createDrain } from '../clever-client/drains.js';
import * as Application from './application.js';
import { resolveAddon } from './ids-resolver.js';
import { sendToApi } from './send-to-api.js';

export async function resolveDrainResource(alias, appIdOrName, addonIdOrRealId) {
  if (addonIdOrRealId != null && (appIdOrName != null || alias != null)) {
    throw new Error('`--addon` cannot be combined with `--app` or `--alias`');
  }

  if (addonIdOrRealId != null) {
    const { ownerId, realId } = await resolveAddon(addonIdOrRealId);
    return { ownerId, resourceId: realId };
  }

  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  return { ownerId, resourceId: appId };
}

export const DRAIN_KINDS = /** @type {const} */ (['LOG', 'ACCESSLOG']);

/**
 * Creates a drain, the recipient options that are not set are left out of the payload.
 * @param {string} type - Drain type, as expected by the API
 * @param {typeof DRAIN_KINDS[number]} kind - Kind of logs sent to the drain
 * @param {string} ownerId
 * @param {string} resourceId
 * @param {string} url - Drain URL
 * @param {Record<string, unknown>} [recipientOptions] - Extra recipient fields, `null` and `undefined` ones are ignored
 */
export function createLogDrain(type, kind, ownerId, resourceId, url, recipientOptions = {}) {
  const body = { kind, recipient: { type, url } };

  for (const key in recipientOptions) {
    if (recipientOptions[key] != null) {
      body.recipient[key] = recipientOptions[key];
    }
  }

  return createDrain({ ownerId, resourceId, body }).then(sendToApi);
}

export const DRAIN_TYPE_LABELS = {
  BETTERSTACK: 'Better Stack',
  DATADOG: 'Datadog',
  ELASTICSEARCH: 'Elasticsearch',
  NEWRELIC: 'New Relic',
  OVH_TCP: 'OVH TCP',
  RAW_HTTP: 'Raw HTTP',
  SPLUNK: 'Splunk',
  SYSLOG_TCP: 'Syslog TCP',
  SYSLOG_UDP: 'Syslog UDP',
};

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

export function formatDrain(rawDrain) {
  const details = [];

  details.push(['ID', rawDrain.id]);
  details.push(['Kind', rawDrain.kind]);
  details.push(['Status', rawDrain.status.status]);
  details.push(['Execution status', rawDrain.execution.status]);
  details.push(['URL', rawDrain.recipient.url]);
  details.push(['Type', DRAIN_TYPE_LABELS[rawDrain.recipient.type]]);
  details.push(['Custom index', rawDrain.recipient.index]);
  details.push(['Sourcetype', rawDrain.recipient.sourcetype]);

  // DEFAULT is the implicit norm, only a relaxed verification is worth showing
  if (rawDrain.recipient.tlsVerification === 'TRUSTFUL') {
    details.push(['TLS verification', 'Trustful (certificate not verified)']);
  }

  details.push(['SD parameters', rawDrain.recipient.rfc5424StructuredDataParameters]);

  // backlog is null when the API cannot get the drain subscription stats
  // (e.g. not created yet, or disabled drain whose subscription was cleaned up)
  if (rawDrain.backlog != null) {
    details.push(['Message output rate', formatRate(rawDrain.backlog.msgRateOut)]);
    details.push(['Message throughput', formatThroughput(rawDrain.backlog.msgThroughputOut)]);
    details.push(['Backlog', rawDrain.backlog.msgBacklog + ' pending messages']);
  }

  if (rawDrain.execution.attempt != null && rawDrain.execution.maxAttempt != null) {
    details.push(['Retry attempts', `${rawDrain.execution.attempt}/${rawDrain.execution.maxAttempt}`]);
  }

  details.push(['Last attempt at', rawDrain.execution.lastAttemptAt]);
  details.push(['Next attempt at', rawDrain.execution.nextAttemptAt]);
  details.push(['Retrying since', rawDrain.execution.retryingSince]);
  details.push(['Last error', rawDrain.execution.lastError]);

  return Object.fromEntries(details.filter(([_name, value]) => value != null));
}
