import { getAllApplicationInstances } from '@clevercloud/client/esm/api/v4/instance.js';
import { toDate } from '../lib/date-utils.js';
import { sendToApi } from './send-to-api.js';

// States in which the VM is running
const RUNNING_STATES = [
  'BOOTING',
  'STARTING',
  'READY',
  'BUILDING',
  'DEPLOYING',
  'UP',
  'TASK_IN_PROGRESS',
  'MIGRATION_IN_PROGRESS',
  'STOPPING',
];

/**
 * @typedef {object} Instance
 * @property {number} [instanceNumber] - Position of the instance within its deployment, starting at 0 (build VMs are also numbered 0), missing at the very beginning of booting
 * @property {string} id
 * @property {string|null} name
 * @property {string} state
 * @property {string|null} flavor
 * @property {boolean} isBuildVm
 * @property {string} deploymentId
 * @property {string} createdAt - ISO 8601 date
 * @property {string|null} deletedAt - ISO 8601 date
 */

/**
 * Lists the instances of an application, sorted by creation date (oldest first).
 * The API returns the most recent instances first, so `limit` keeps the N most recent ones.
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} params.appId
 * @param {boolean} [params.onlyRunning] - Only keep instances whose VM is running
 * @param {Date} [params.since] - Only keep instances deleted at or after this date, or not deleted yet
 * @param {Date} [params.until] - Only keep instances created at or before this date
 * @param {string} [params.deploymentId] - Only keep instances created by this deployment
 * @param {number} [params.limit]
 * @returns {Promise<Array<Instance>>}
 */
export async function listInstances({ ownerId, appId, onlyRunning, since, until, deploymentId, limit }) {
  const rawInstances = await getAllApplicationInstances({
    ownerId,
    applicationId: appId,
    // The API rejects a repeated query parameter but accepts a comma-separated list
    includeState: onlyRunning ? RUNNING_STATES.join(',') : undefined,
    since: since?.toISOString(),
    until: until?.toISOString(),
    deploymentId,
    limit,
  }).then(sendToApi);

  return rawInstances.map(normalizeInstance).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * @param {object} rawInstance - Instance as returned by the v4 orchestration API
 * @returns {Instance}
 */
function normalizeInstance(rawInstance) {
  return {
    instanceNumber: rawInstance.index,
    id: rawInstance.id,
    name: rawInstance.name ?? null,
    state: rawInstance.state,
    flavor: rawInstance.flavor ?? null,
    isBuildVm: rawInstance.isBuildVm,
    deploymentId: rawInstance.deploymentId,
    createdAt: toDate(rawInstance.creationDate).toISOString(),
    deletedAt: toDate(rawInstance.deletionDate)?.toISOString() ?? null,
  };
}
