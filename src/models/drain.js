import { createDrain, getOwnerDrains } from '../clever-client/drains.js';
import * as Application from './application.js';
import { resolveAddon } from './ids-resolver.js';
import * as Organisation from './organisation.js';
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
 * List the drains of every resource an owner has, grouped by owner.
 * When `orgaIdOrName` is null, all the owners the current user belongs to are listed.
 * An owner whose drains cannot be listed is returned with its `error`, so that one
 * unreachable organisation doesn't hide the drains of all the others.
 * @param {{ orga_id: String }|{ orga_name: String }|null} orgaIdOrName
 * @returns {Promise<Array<{ id: String, name: String, drains: Array<Object>, error: Error|null }>>}
 */
export async function getAllDrains(orgaIdOrName) {
  const owners = await Organisation.listOwners(orgaIdOrName);

  // `listOwners` only filters on an ID, an organisation ID matching nothing is not an empty result
  if (orgaIdOrName != null && owners.length === 0) {
    throw new Error('Organisation not found');
  }

  return Promise.all(
    owners.map(async (org) => {
      // Drains are attached to applications by their ID and to add-ons by their real ID
      const resourceNames = new Map([
        ...org.applications.map((app) => [app.id, app.name]),
        ...org.addons.map((addon) => [addon.realId, addon.name]),
      ]);

      try {
        const drains = await getOwnerDrains({ ownerId: org.id }).then(sendToApi);
        return {
          id: org.id,
          name: org.name,
          drains: drains
            .map((drain) => ({ ...drain, resourceName: resourceNames.get(drain.resourceId) }))
            .sort((a, b) => (a.resourceName ?? '').localeCompare(b.resourceName ?? '')),
          error: null,
        };
      } catch (error) {
        return { id: org.id, name: org.name, drains: [], error };
      }
    }),
  );
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

/**
 * Format a drain as a row of the table listing several drains.
 * @param {Object} rawDrain
 * @param {String} [resourceLabel] the resource the drain belongs to, when the table mixes several of them
 */
export function formatDrainRow(rawDrain, resourceLabel) {
  return {
    ID: rawDrain.id,
    ...(resourceLabel != null ? { Resource: resourceLabel } : {}),
    Kind: rawDrain.kind,
    Status: rawDrain.status.status,
    'Execution status': rawDrain.execution.status,
    URL: rawDrain.recipient.url,
  };
}

export function formatDrain(rawDrain) {
  const drainDetails = [
    ['ID', rawDrain.id],
    ['Kind', rawDrain.kind],
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
