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

/**
 * Creates a log drain, the recipient options that are not set are left out of the payload.
 * @param {string} type - Drain type, as expected by the API
 * @param {string} ownerId
 * @param {string} resourceId
 * @param {string} url - Drain URL
 * @param {Record<string, unknown>} [recipientOptions] - Extra recipient fields, `null` and `undefined` ones are ignored
 */
export function createLogDrain(type, ownerId, resourceId, url, recipientOptions = {}) {
  const body = { kind: 'LOG', recipient: { type, url } };

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
  const drainDetails = [
    ['ID', rawDrain.id],
    ['Status', rawDrain.status.status],
    ['Execution status', rawDrain.execution.status],
    ['URL', rawDrain.recipient.url],
    ['Type', DRAIN_TYPE_LABELS[rawDrain.recipient.type]],
    ['Custom index', rawDrain.recipient.index],
    ['Sourcetype', rawDrain.recipient.sourcetype],
    // DEFAULT is the implicit norm, only a relaxed verification is worth showing
    [
      'TLS verification',
      rawDrain.recipient.tlsVerification === 'TRUSTFUL' ? 'Trustful (certificate not verified)' : null,
    ],
    ['SD parameters', rawDrain.recipient.rfc5424StructuredDataParameters],
    ['Message output rate', formatRate(rawDrain.backlog.msgRateOut)],
    ['Message throughput', formatThroughput(rawDrain.backlog.msgThroughputOut)],
    ['Backlog', rawDrain.backlog.msgBacklog + ' pending messages'],
    [
      'Retry attempts',
      rawDrain.execution.attempt != null && rawDrain.execution.maxAttempt != null
        ? `${rawDrain.execution.attempt}/${rawDrain.execution.maxAttempt}`
        : null,
    ],
    ['Last attempt at', rawDrain.execution.lastAttemptAt],
    ['Next attempt at', rawDrain.execution.nextAttemptAt],
    ['Retrying since', rawDrain.execution.retryingSince],
    ['Last error', rawDrain.execution.lastError],
  ];
  return Object.fromEntries(drainDetails.filter(([_name, value]) => value != null));
}
