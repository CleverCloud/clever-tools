import colors from 'colors/safe.js';
import * as networkGroup from './ng.js';
import * as networkGroupApi from '@clevercloud/client/esm/api/v4/network-group.js';

import crypto from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Logger } from '../logger.js';
import { sendToApi } from './send-to-api.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';

/**
 * Create an external peer and link its parent member to the Network Group
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {string} peerLabel External peer label
 * @param {string} publicKey External peer public key
 * @param {object} org Organisation ID or name
 * @throws {Error} If a valid peer label is not provided
 * @throws {Error} If the Network Group is not found
 * @throws {Error} If the parent member is not linked to the Network Group
 * @throws {Error} If the external peer is not linked to the Network Group
 */
export async function createExternalPeerWithParent (ngIdOrLabel, peerLabel, publicKey, org) {

  if (!peerLabel) {
    throw new Error('A valid peer label is required');
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  // We define a parent member for the external peer
  const id = `external_${crypto.randomUUID()}`;
  const parentMember = {
    id,
    label: `Parent of ${peerLabel}`,
    domainName: `${id}.m.${ng.id}.${networkGroup.DOMAIN}`,
    kind: 'EXTERNAL',
  };

  Logger.info(`Creating a parent member ${parentMember.id} linked to Network Group ${ng.id}`);
  await linkMember({ ngId: ng.id }, parentMember.id, org, parentMember.label);

  const checkParentMember = await checkResource(ng.id, org, parentMember.id, true);
  if (!checkParentMember) {
    throw new Error(`Parent member ${colors.red(parentMember.id)} not linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`Parent member ${parentMember.id} created and linked to Network Group ${ng.id}`);

  // We define the external peer, for now we only support client role
  const body = {
    peerRole: 'CLIENT',
    publicKey,
    label: peerLabel,
    parentMember: parentMember.id,
  };

  Logger.info(`Adding external peer to Member ${parentMember.id} of Network Group ${ng.id}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkGroupApi.createNetworkGroupExternalPeer({ ownerId: ng.ownerId, networkGroupId: ng.id }, body).then(sendToApi);

  const checkExternalPeer = await checkResource(ng.id, org, peerLabel, true, 'peer', 'label');
  if (!checkExternalPeer) {
    throw new Error(`External peer ${colors.red(peerLabel)} not linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`External peer ${peerLabel} added to Member ${parentMember.id} of Network Group ${ng.id}`);
}

/**
 * Delete an external peer and its parent member from a Network Group
 * @param {object} ngIdOrLabel Network Group ID or label
 * @param {string} peerIdOrLabel External peer ID or label
 * @param {object} org Organisation ID or name
 * @throws {Error} If the Network Group is not found
 * @throws {Error} If the External Peer is not found
 * @throws {Error} If the External Peer is still linked to the Network Group
 * @throws {Error} If the Parent Member is still linked to the Network Group
 */
export async function deleteExternalPeerWithParent (ngIdOrLabel, peerIdOrLabel, org) {

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  const externalPeer = ng.peers.find((p) => {
    return p.id === peerIdOrLabel || p.label === peerIdOrLabel;
  });

  if (!externalPeer) {
    throw new Error(`External peer ${colors.red(peerIdOrLabel)} not found`);
  }

  Logger.info(`Deleting external peer ${externalPeer.id} from Network Group ${ng.id}`);
  await networkGroupApi.deleteNetworkGroupExternalPeer({ ownerId: ng.ownerId, networkGroupId: ng.id, peerId: externalPeer.id }).then(sendToApi);

  const checkPeer = await checkResource(ng.id, org, externalPeer.id, false, 'peer');
  if (!checkPeer) {
    throw new Error(`External peer ${colors.red(externalPeer.id)} still linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`External peer ${externalPeer.id} deleted from Network Group ${ng.id}`);
  Logger.info(`Unlinking parent member ${externalPeer.parentMember} from Network Group ${ng.id}`);

  await unlinkMember(ngIdOrLabel, externalPeer.parentMember, org);

  const checkParentMember = await checkResource(ng.id, org, externalPeer.parentMember, false);
  if (!checkParentMember) {
    throw new Error(`Parent member ${colors.red(externalPeer.parentMember)} still linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`Parent member ${externalPeer.parentMember} unlinked from Network Group ${ng.id}`);
}

/**
 * Link a Member to a Network Group
 * @param {object} ngIdOrLabel The Network group ID or Label
 * @param {string} memberId ID of the Member to link
 * @param {object} org Organisation ID or name
 * @param {string} label Label of the Member
 */
export async function linkMember (ngIdOrLabel, memberId, org, label) {
  if (!memberId) {
    throw new Error('A valid member ID is required (addon_xxx, app_xxx, external_xxx)');
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  await checkMembersToLink([memberId], ng.ownerId);

  const alreadyMember = ng.members.find((m) => m.id === memberId);
  if (alreadyMember) {
    throw new Error(`Member ${colors.red(memberId)} is already linked to Network Group ${colors.red(ng.id)}`);
  }

  const [member] = networkGroup.constructMembers(ng.id, [memberId]);

  const body = {
    id: member.id,
    label: label || member.label,
    domainName: member.domainName,
    kind: member.kind,
  };

  Logger.info(`Linking member ${member.id} to Network Group ${ng.id}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkGroupApi.createNetworkGroupMember({ ownerId: ng.ownerId, networkGroupId: ng.id }, body).then(sendToApi);

  const check = await checkResource(ng.id, org, member.id, true);
  if (!check) {
    throw new Error(`Member ${colors.red(member.id)} not linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`Member ${member.id} linked to Network Group ${ng.id}`);
}

/**
 * Unlink a Member from a Network Group
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {string} memberId The Member ID
 * @param {object} org Organisation ID or name
 * @throws {Error} If a valid member ID is not provided
 * @throws {Error} If the Network Group is not found
 * @throws {Error} If the Member is not found in the Network Group
 * @throws {Error} If the Member is still linked to the Network Group
 */
export async function unlinkMember (ngIdOrLabel, memberId, org) {
  if (!memberId) {
    throw new Error('A valid member ID is required (addon_xxx, app_xxx, external_xxx)');
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngLabel)} not found`);
  }

  const member = ng.members.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Member ${colors.red(memberId)} not found in Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`Unlinking member ${memberId} from Network Group ${ng.id}`);
  await networkGroupApi.deleteNetworkGroupMember({ ownerId: ng.ownerId, networkGroupId: ng.id, memberId }).then(sendToApi);

  const check = await checkResource(ng.id, org, memberId, false);
  if (!check) {
    throw new Error(`Member ${colors.red(memberId)} still linked to Network Group ${colors.red(ng.id)}`);
  }

  Logger.info(`Member ${memberId} unlinked from Network Group ${ng.id}`);
}

/**
 * Check if members can be linked to a Network Group
 * @param {Array<string>} members Members to check
 * @throws {Error} If members can't be linked to a Network Group
 */
export async function checkMembersToLink (members, ownerId) {
  const VALID_ADDON_PROVIDERS = [
    'es-addon',
    'mongodb-addon',
    'mysql-addon',
    'postgresql-addon',
    'redis-addon',
  ];

  const summary = await getSummary().then(sendToApi);

  let data = summary.user;
  if (summary.user.id !== ownerId) {
    data = summary.organisations.find((o) => o.id === ownerId);
  }

  const membersNotOK = [];
  let source = data.applications;

  for (const memberId of members) {
    if (memberId.startsWith('addon_')) source = data.addons;

    const foundRessource = source.find((r) => r.id === memberId);

    if (foundRessource && memberId.startsWith('addon_') && !VALID_ADDON_PROVIDERS.includes(foundRessource.providerId)) {
      membersNotOK.push(memberId);
    }
    else if (!foundRessource && !memberId.startsWith('external_')) {
      membersNotOK.push(memberId);
    }
  }

  if (membersNotOK.length > 0) {
    throw new Error(`Member(s) ${colors.red(membersNotOK.join(', '))} can't be linked to the Network Group, check Organisation ID or name`);
  }
}

/**
 * Check if a resource is present in a Network Group by ID or label
 * @param {string} ngId Network Group ID
 * @param {object} org Organisation ID or name
 * @param {string} resource Resource ID or label
 * @param {boolean} shouldBePresent Expected presence of the resource
 * @param {string} [resourceType] Resource type (member or peer), default is member
 * @param {string} [searchBy] Search by 'id' or 'label', default is 'id'
 * @returns {Promise<boolean>} True if the resource is present, false otherwise
 */
async function checkResource (ngId, org, resource, shouldBePresent, resourceType = 'member', searchBy = 'id') {
  const endTime = Date.now() + networkGroup.POLLING_TIMEOUT_MS;

  while (Date.now() < endTime) {
    const ng = await networkGroup.getNG(ngId, org);
    const items = resourceType === 'member' ? ng.members : ng.peers;
    const isPresent = items.some((item) => item[searchBy] === resource);

    if (isPresent === shouldBePresent) {
      return true;
    }

    await setTimeout(networkGroup.POLLING_INTERVAL_MS);
  }
  return false;
}
