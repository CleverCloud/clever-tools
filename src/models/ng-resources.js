import { CreateNetworkGroupExternalPeerCommand } from '@clevercloud/client/cc-api-commands/network-group/create-network-group-external-peer-command.js';
import { CreateNetworkGroupMemberCommand } from '@clevercloud/client/cc-api-commands/network-group/create-network-group-member-command.js';
import { DeleteNetworkGroupExternalPeerCommand } from '@clevercloud/client/cc-api-commands/network-group/delete-network-group-external-peer-command.js';
import { DeleteNetworkGroupMemberCommand } from '@clevercloud/client/cc-api-commands/network-group/delete-network-group-member-command.js';
import crypto from 'node:crypto';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import { clients } from './cc-api-client.js';
import * as networkGroup from './ng.js';
import { NG_MEMBER_PREFIXES } from './ng.js';

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
export async function createExternalPeerWithParent(ngIdOrLabel, peerLabel, publicKey, org) {
  if (!peerLabel) {
    throw new Error('A valid peer label is required');
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  // We define a parent member for the external peer
  const parentMemberId = `external_${crypto.randomUUID()}`;
  const parentMemberLabel = `Parent of ${peerLabel}`;

  Logger.info(`Creating a parent member ${parentMemberId} linked to Network Group ${ng.id}`);
  await linkMember({ ngId: ng.id }, parentMemberId, org, parentMemberLabel);
  Logger.info(`Parent member ${parentMemberId} created and linked to Network Group ${ng.id}`);

  // We define the external peer, for now we only support client role
  Logger.info(`Adding external peer to Member ${parentMemberId} of Network Group ${ng.id}`);
  await clients.ccApi.send(
    new CreateNetworkGroupExternalPeerCommand({
      ownerId: ng.ownerId,
      networkGroupId: ng.id,
      label: peerLabel,
      peerRole: 'CLIENT',
      publicKey,
      parentMember: parentMemberId,
    }),
  );

  Logger.info(`External peer ${peerLabel} added to Member ${parentMemberId} of Network Group ${ng.id}`);
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
export async function deleteExternalPeerWithParent(ngIdOrLabel, peerIdOrLabel, org) {
  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  const externalPeer = ng.peers.find((p) => {
    return p.id === peerIdOrLabel || p.label === peerIdOrLabel;
  });

  if (!externalPeer) {
    throw new Error(`External peer ${styleText('red', peerIdOrLabel)} not found`);
  }

  Logger.info(`Deleting external peer ${externalPeer.id} from Network Group ${ng.id}`);
  await clients.ccApi.send(
    new DeleteNetworkGroupExternalPeerCommand({
      ownerId: ng.ownerId,
      networkGroupId: ng.id,
      externalPeerId: externalPeer.id,
    }),
  );

  Logger.info(`External peer ${externalPeer.id} deleted from Network Group ${ng.id}`);
  Logger.info(`Unlinking parent member ${externalPeer.parentMember} from Network Group ${ng.id}`);

  await unlinkMember(ngIdOrLabel, externalPeer.parentMember, org);

  Logger.info(`Parent member ${externalPeer.parentMember} unlinked from Network Group ${ng.id}`);
}

/**
 * Link a Member to a Network Group
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {string} memberId ID of the Member to link
 * @param {object} org Organisation ID or name
 * @param {string} label Label of the Member
 */
export async function linkMember(ngIdOrLabel, memberId, org, label) {
  if (!memberId) {
    throw new Error(
      'A valid member ID is required (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)',
    );
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  checkMembersToLink([memberId]);

  const alreadyMember = ng.members.find((m) => m.id === memberId);
  if (alreadyMember) {
    throw new Error(
      `Member ${styleText('red', memberId)} is already linked to Network Group ${styleText('red', ng.id)}`,
    );
  }

  Logger.info(`Linking member ${memberId} to Network Group ${ng.id}`);
  await clients.ccApi.send(
    new CreateNetworkGroupMemberCommand({
      ownerId: ng.ownerId,
      networkGroupId: ng.id,
      memberId,
      label,
    }),
  );

  Logger.info(`Member ${memberId} linked to Network Group ${ng.id}`);
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
export async function unlinkMember(ngIdOrLabel, memberId, org) {
  if (!memberId) {
    throw new Error(
      'A valid member ID is required (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)',
    );
  }

  const [ng] = await networkGroup.searchNgOrResource(ngIdOrLabel, org, 'NetworkGroup');

  if (!ng) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId || ngIdOrLabel.ngLabel)} not found`);
  }

  const member = ng.members.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Member ${styleText('red', memberId)} not found in Network Group ${styleText('red', ng.id)}`);
  }

  Logger.info(`Unlinking member ${memberId} from Network Group ${ng.id}`);
  await clients.ccApi.send(
    new DeleteNetworkGroupMemberCommand({
      ownerId: ng.ownerId,
      networkGroupId: ng.id,
      memberId,
    }),
  );

  Logger.info(`Member ${memberId} unlinked from Network Group ${ng.id}`);
}

/**
 * Check if members can be linked to a Network Group
 * @param {Array<string>} memberIds Members to check
 * @throws {Error} If members can't be linked to a Network Group
 */
export function checkMembersToLink(memberIds) {
  const validPrefixes = Object.keys(NG_MEMBER_PREFIXES);
  const membersNotOK = [];

  for (const memberId of memberIds) {
    const hasValidPrefix = validPrefixes.some((prefix) => memberId.startsWith(prefix));
    if (!hasValidPrefix) {
      membersNotOK.push(memberId);
    }
  }

  if (membersNotOK.length > 0) {
    throw new Error(
      `Member(s) ${styleText('red', membersNotOK.join(', '))} can't be linked to the Network Group, check member ID format`,
    );
  }
}
