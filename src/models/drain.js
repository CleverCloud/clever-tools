import { getOwnerDrains } from '../clever-client/drains.js';
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
 * Format a drain as a row of the table listing several drains.
 * @param {Object} rawDrain
 * @param {String} [resourceLabel] the resource the drain belongs to, when the table mixes several of them
 */
export function formatDrainRow(rawDrain, resourceLabel) {
  return {
    ID: rawDrain.id,
    ...(resourceLabel != null ? { Resource: resourceLabel } : {}),
    Status: rawDrain.status.status,
    'Execution status': rawDrain.execution.status,
    URL: rawDrain.recipient.url,
  };
}

export function formatDrain(rawDrain) {
  const drainType = DRAIN_TYPES[rawDrain.recipient.type];
  const drainDetails = [
    ['ID', rawDrain.id],
    ['Status', rawDrain.status.status],
    ['Execution status', rawDrain.execution.status],
    ['URL', rawDrain.recipient.url],
    ['Type', drainType.label],
    ['Custom index', rawDrain.recipient.index],
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
