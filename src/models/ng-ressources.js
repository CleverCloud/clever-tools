import * as NG from './ng.js';
import * as ngApi from '@clevercloud/client/cjs/api/v4/network-group.js';

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger.js';
import { sendToApi } from './send-to-api.js';

const TIMEOUT = 30;
const INTERVAL = 1000;

export async function linkMember (ngIdOrLabel, ressourceId, org, label) {
  const found = await NG.getNgOrRessource(ngIdOrLabel, org);

  if (found.type !== 'ng') {
    throw new Error(`${ngIdOrLabel} is not a Network Group`);
  }
  const [member] = NG.constructMembers(found.item.id, [ressourceId]);

  const body = {
    id: member.id,
    label: label || member.id,
    domainName: member.domainName,
    type: member.type,
  };

  Logger.info(`Linking member ${member.id} to Network Group ${found.item.id}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupMember({ ownerId: found.item.ownerId, networkGroupId: found.item.id }, body).then(sendToApi);
  await waitForResourceStatus(
    org,
    (ng) => ng.members.some((m) => m.id === member.id),
  );
  Logger.info(`Member ${member.id} linked to Network Group ${found.item.id}`);
}

export async function unlinkMember (ngIdOrLabel, memberId, org) {
  const found = await NG.getNgOrRessource(ngIdOrLabel, org);

  if (found.type !== 'ng') {
    throw new Error(`${ngIdOrLabel} is not a Network Group`);
  }

  Logger.info(`Unlinking member ${memberId} from Network Group ${found.item.id}`);
  await ngApi.deleteNetworkGroupMember({ ownerId: found.item.ownerId, networkGroupId: found.item.id, memberId }).then(sendToApi);
  await waitForResourceStatus(
    org,
    (ng) => !ng.members.some((m) => m.id === memberId),
  );
  Logger.info(`Member ${memberId} unlinked from Network Group ${found.item.id}`);
}

export async function createExternalPeerWithParent (ngIdOrLabel, label, publicKey, org) {
  const found = await NG.getNgOrRessource(ngIdOrLabel, org);

  if (found.type !== 'ng') {
    throw new Error(`${ngIdOrLabel} is not a Network Group`);
  }

  // For now, we create and link a parent member to use it for the external peer
  const parentMember = {
    id: `external_${uuidv4()}`,
    label: `Parent of ${label}`,
    domainName: `${label}.m.${found.item.id}.${NG.DOMAIN}`,
    type: 'external',
  };

  Logger.info(`Creating a parent member ${parentMember.id} linked to Network Group ${found.item.id}`);
  await linkMember(found.item.id, parentMember.id, org, parentMember.label);
  await waitForResourceStatus(
    org,
    (ng) => !ng.members.some((m) => m.id === parentMember.id),
  );
  Logger.info(`Parent member ${parentMember.id} created and linked to Network Group ${found.item.id}`);

  // For now we only support client role
  const body = {
    peerRole: 'client',
    publicKey,
    label,
    parentMember: parentMember.id,
  };

  Logger.info(`Adding external peer to Member ${parentMember.id} of Network Group ${found.item.id}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupExternalPeer({ ownerId: found.item.ownerId, networkGroupId: found.item.id }, body).then(sendToApi);

  await waitForResourceStatus(
    org,
    (ng) => ng.peers.some((p) => p.label === label),
  );

  Logger.info(`External peer ${label} added to Member ${parentMember.id} of Network Group ${found.item.id}`);
}

/**
 * Delete an external peer and its parent member from a Network Group
 * @param {string} ngIdOrLabel Network Group ID or label
 * @param {string} label External peer label
 * @param {string} org Organisation ID or name
 */
export async function deleteExternalPeerWithParent (ngIdOrLabel, label, org) {
  const found = await NG.getNgOrRessource(ngIdOrLabel, org);

  if (found.type !== 'ng') {
    throw new Error(`${ngIdOrLabel} is not a Network Group`);
  }

  const peer = found.item.peers.find((p) => p.label === label);

  if (!peer) {
    throw new Error(`Peer ${label} not found`);
  }

  const body = {
    ownerId: found.item.ownerId,
    networkGroupId: found.item.id,
    peerId: peer.id,
  };

  Logger.info(`Deleting external peer ${peer.id} from Network Group ${found.item.id}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.deleteNetworkGroupExternalPeer(body).then(sendToApi);
  await waitForResourceStatus(
    org,
    (ng) => ng.peers.some((p) => p.id === peer.id),
  );
  Logger.info(`External peer ${peer.id} deleted from Network Group ${found.item.id}`);

  Logger.info(`Unlinking parent member ${peer.parentMember} from Network Group ${found.item.id}`);
  await unlinkMember(ngIdOrLabel, peer.parentMember, org);
  await waitForResourceStatus(
    org,
    (ng) => ng.members.some((m) => m.id === peer.parentMember),
  );
  Logger.info(`Parent member ${peer.parentMember} unlinked from Network Group ${found.item.id}`);
}

/**
 * Wait for a resource to reach a specific status
 * @param {string} org Organisation ID or name
 * @param {Function} statusCheckFn Status check function
 * @param {number} timeout Timeout in seconds
 * @param {number} interval Interval in milliseconds
 */
async function waitForResourceStatus (org, statusCheckFn, timeout = TIMEOUT, interval = INTERVAL) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout * 1000) {
    const ngs = await NG.getNGs(org);
    if (!ngs.some(statusCheckFn)) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
