import colors from 'colors/safe.js';
import * as User from '../models/user.js';
import * as Organisation from '../models/organisation.js';
import * as ngApi from '@clevercloud/client/cjs/api/v4/network-group.js';

import { searchNetworkGroupOrResource } from './ng-api.js';
import { checkMembersToLink } from './ng-resources.js';
import { sendToApi } from './send-to-api.js';
import { Logger } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

export const TIMEOUT = 30;
export const INTERVAL = 1000;
export const DOMAIN = 'cc-ng.cloud';
export const TYPE_PREFIXES = {
  app_: 'APPLICATION',
  addon_: 'ADDON',
  external_: 'EXTERNAL',
};

/**
 * Ask for a Network Group creation
 * @param {string} label The Network Group label
 * @param {string} description The Network Group description
 * @param {string} tags The Network Group tags
 * @param {Array<string>} membersIds The members to link to the Network Group
 * @param {string} orgaIdOrName The owner ID or name
 * @throws {Error} If the Network Group label is missing
 */
export async function create (label, description, tags, membersIds, orgaIdOrName) {
  if (!label) {
    throw new Error('A valid Network Group label is required');
  }

  const id = `ng_${uuidv4()}`;
  const ownerId = await getOwnerIdFromOrgaIdOrName(orgaIdOrName);

  if (membersIds?.length > 0) {
    await checkMembersToLink(membersIds, ownerId);
  }

  const members = constructMembers(id, membersIds || []);
  const body = { ownerId, id, label, description, tags, members };

  Logger.info(`Creating Network Group ${label} (${id}) from owner ${ownerId}`);
  Logger.info(`${members.length} members will be added: ${members.map((m) => m.id).join(', ')}`);
  Logger.debug(`Sending body: ${JSON.stringify(body, null, 2)}`);
  await ngApi.createNetworkGroup({ ownerId }, body).then(sendToApi);

  await pollNetworkGroup(ownerId, id, { waitForMembers: membersIds });
  Logger.info(`Network Group ${label} (${id}) created from owner ${ownerId}`);
}

/**
 * Ask for a Network Group deletion
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {object} orgaIdOrName The owner ID or name
 * @throws {Error} If the Network Group is not found
 */
export async function destroy (ngIdOrLabel, orgaIdOrName) {
  const [found] = await searchNgOrResource(ngIdOrLabel, orgaIdOrName, 'NetworkGroup');

  if (!found) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  await ngApi.deleteNetworkGroup({ ownerId: found.ownerId, networkGroupId: found.id }).then(sendToApi);
  Logger.info(`Deleting Network Group ${found.id} from owner ${found.ownerId}`);
  await pollNetworkGroup(found.ownerId, found.id, { waitForDeletion: true });
  Logger.info(`Network Group ${found.id} deleted from owner ${found.ownerId}`);
}

/**
 * Get the Wireguard configuration of a Network Group peer
 * @param {object} peerIdOrLabel The Peer ID or Label
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {object} orgaIdOrName The owner ID or name
 * @returns {Promise<Object>} The Peer Wireguard configuration
 * @throws {Error} If the Peer is not found
 * @throws {Error} If the Network Group is not found
 * @throws {Error} If the Peer is not in the Network Group
 */
export async function getPeerConfig (peerIdOrLabel, ngIdOrLabel, orgaIdOrName) {
  const [parentNg] = await searchNgOrResource(ngIdOrLabel, orgaIdOrName, 'NetworkGroup');

  if (!parentNg) {
    throw new Error(`Network Group ${colors.red(ngIdOrLabel.ngId || ngIdOrLabel.ngResourceLabel)} not found`);
  }

  const [peer] = await searchNgOrResource(peerIdOrLabel, orgaIdOrName, 'Peer');

  if (!peer || (peerIdOrLabel.ngResourceLabel && peer.label !== peerIdOrLabel.ngResourceLabel)) {
    throw new Error(`Peer ${colors.red(peerIdOrLabel.ngResourceLabel || peerIdOrLabel.member)} not found`);
  }

  if (!parentNg.peers.find((p) => p.id === peer.id)) {
    throw new Error(`Peer ${colors.red(peer.id)} is not in Network Group ${colors.red(parentNg.id)}`);
  }

  Logger.debug(`Getting configuration for Peer ${peer.id}`);
  const result = await ngApi.getNetworkGroupWireGuardConfiguration({
    ownerId: parentNg.ownerId,
    networkGroupId: parentNg.id,
    peerId: peer.id,
  }).then(sendToApi);
  Logger.debug(`Received from API:\n${JSON.stringify(result, null, 2)}`);

  return result;
}

/**
 * Get a Network group from an owner with members and peers
 * @param {string} networkGroupId The Network Group ID
 * @param {string} orgaIdOrName The owner ID or name
 * @returns {Promise<Array<Object>>} The Network Groups
 */
export async function getNG (networkGroupId, orgaIdOrName) {
  const ownerId = await getOwnerIdFromOrgaIdOrName(orgaIdOrName);

  Logger.info(`Get Network Group ${networkGroupId} for owner ${ownerId}`);
  const result = await ngApi.getNetworkGroup({ networkGroupId, ownerId }).then(sendToApi);
  Logger.debug(`Received from API:\n${JSON.stringify(result, null, 2)}`);

  return result;
}

/**
 * Get all Network Groups from an owner with members and peers
 * @param {string} orgaIdOrName The owner ID or name
 * @returns {Promise<Array<Object>>} The Network Groups
 */
export async function getAllNGs (orgaIdOrName) {
  const ownerId = await getOwnerIdFromOrgaIdOrName(orgaIdOrName);

  Logger.info(`Listing Network Groups from owner ${ownerId}`);
  const result = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
  Logger.debug(`Received from API:\n${JSON.stringify(result, null, 2)}`);
  return result;
}

/**
 * Search a Network Group or a resource (member/peer)
 * @param {string|Object} idOrLabel The ID or label to look for
 * @param {Object} orgaIdOrName The owner ID or name
 * @param {string} [type] Look only for a specific type (NetworkGroup, Member, CleverPeer, ExternalPeer, Peer), can be 'single', default to 'all'
 * @param {boolean} exactMatch Look for exact match, default to true
 * @throws {Error} If multiple Network Groups or member/peer are found in single_result mode
 * @returns {Promise<Object>} Found results
 */
export async function searchNgOrResource (idOrLabel, orgaIdOrName, type = 'all', exactMatch = true) {
  const ownerId = await getOwnerIdFromOrgaIdOrName(orgaIdOrName);

  // If idOrLabel is a string we use it, or we look through multiple keys
  const query = typeof idOrLabel === 'string'
    ? idOrLabel
    : (
        idOrLabel.ngId
        || idOrLabel.memberId
        || idOrLabel.ngResourceLabel
      );

  const found = await searchNetworkGroupOrResource({ ownerId, query }).then(sendToApi);

  let filtered = found;
  switch (type) {
    case 'all':
    case 'single':
      break;
    case 'Peer':
      filtered = found.filter((f) => f.type === 'CleverPeer' || f.type === 'ExternalPeer');
      break;
    case 'CleverPeer':
    case 'ExternalPeer':
    case 'Member':
    case 'NetworkGroup':
      filtered = found.filter((f) => f.type === type);
      break;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }

  if (exactMatch) {
    filtered = filtered.filter((f) => f.id === query || f.label === query);
  }

  if (filtered.length > 1 && type !== 'all') {
    throw new Error(`Multiple resources found for ${colors.red(query)}, use ID instead:
${filtered.map((f) => ` • ${f.id} ${colors.grey(`(${f.label} - ${f.type})`)}`).join('\n')}`);
  }

  // Deduplicate results
  return filtered.filter((item, index, array) => array.findIndex((element) => (element.id === item.id)) === index);
}

/**
 * Construct members from members_ids
 * @param {string} ngId The Network Group ID
 * @param {Array<string>} membersIds The members IDs
 * @returns {Array<Object>} Array of members with id, domainName and kind
 */
export function constructMembers (ngId, membersIds) {
  return membersIds.map((id) => {
    const domainName = `${id}.m.${ngId}.${DOMAIN}`;
    const prefixToType = TYPE_PREFIXES;

    return {
      id,
      domainName,
      // Get kind from prefix match in id (app_*, addon_*, external_*) or default to 'APPLICATION'
      kind: prefixToType[Object.keys(prefixToType).find((p) => id.startsWith(p))]
        || TYPE_PREFIXES.app_,
    };
  });
}

/**
 * Poll Network Groups to check its status and members
 * @param {string} ownerId The owner ID
 * @param {string} ngId The Network Group ID
 * @param {Array<string>} waitForMembers The members IDs to wait for
 * @param {boolean} waitForDeletion Wait for the Network Group deletion
 * @throws {Error} When timeout is reached
 * @returns {Promise<void>}
 */
async function pollNetworkGroup (ownerId, ngId, { waitForMembers = null, waitForDeletion = false } = {}) {
  return new Promise((resolve, reject) => {
    Logger.info(`Polling Network Groups from owner ${ownerId}`);
    const timeoutTime = Date.now() + (TIMEOUT * 1000);

    async function pollOnce () {
      if (Date.now() > timeoutTime) {
        const action = waitForDeletion ? 'deletion of' : 'creation of';
        reject(new Error(`Timeout while checking ${action} Network Group ${ngId}`));
        return;
      }

      try {
        const ngs = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
        const ng = ngs.find((ng) => ng.id === ngId);

        if (waitForDeletion && !ng) {
          resolve();
          return;
        }

        if (!waitForDeletion && ng) {
          if (waitForMembers?.length) {
            const members = ng.members.filter((member) => waitForMembers.includes(member.id));
            if (members.length !== waitForMembers.length) {
              Logger.debug(`Waiting for members: ${waitForMembers.join(', ')}`);
              setTimeout(pollOnce, INTERVAL);
              return;
            }
          }
          resolve();
          return;
        }

        setTimeout(pollOnce, INTERVAL);
      }
      catch (error) {
        reject(error);
      }
    }

    pollOnce();
  });
}

/**
 * Get the owner ID from an Organisation ID or name
 * @param {object} orgaIdOrName The Organisation ID or name
 * @returns {Promise<string>} The owner ID
 */
async function getOwnerIdFromOrgaIdOrName (orgaIdOrName) {
  return orgaIdOrName != null
    ? Organisation.getId(orgaIdOrName)
    : User.getCurrentId();
}
