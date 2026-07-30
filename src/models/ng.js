import { CreateNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/network-group/create-network-group-command.js';
import { DeleteNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/network-group/delete-network-group-command.js';
import { GetNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/network-group/get-network-group-command.js';
import { GetNetworkGroupWireguardConfigurationCommand } from '@clevercloud/client/cc-api-commands/network-group/get-network-group-wireguard-configuration-command.js';
import { ListNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/network-group/list-network-group-command.js';
import { SearchNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/network-group/search-network-group-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { isTimeoutError, Polling } from '@clevercloud/client/utils/polling.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import { clients } from './cc-api-client.js';
import { getOwnerIdFromOrgIdOrName } from './ids-resolver.js';
import { checkMembersToLink } from './ng-resources.js';

export const POLLING_TIMEOUT_MS = 30_000;
export const POLLING_INTERVAL_MS = 1000;
export const NG_MEMBER_PREFIXES = {
  app_: 'APPLICATION',
  elasticsearch_: 'ADDON',
  mongodb_: 'ADDON',
  mysql_: 'ADDON',
  postgresql_: 'ADDON',
  redis_: 'ADDON',
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
export async function create(label, description, tags, membersIds, orgaIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgaIdOrName);

  if (membersIds?.length > 0) {
    checkMembersToLink(membersIds);
  }

  const members = (membersIds ?? []).map((id) => ({ id }));

  Logger.info(`Creating Network Group ${label} from owner ${ownerId}`);
  Logger.info(`${members.length} members will be added: ${members.map((m) => m.id).join(', ')}`);
  const ng = await clients.ccApi.send(new CreateNetworkGroupCommand({ ownerId, label, description, tags, members }));

  if (membersIds?.length > 0) {
    await waitForMembers(ownerId, ng.id, membersIds);
  }
  Logger.info(`Network Group ${label} (${ng.id}) created from owner ${ownerId}`);
}

/**
 * Ask for a Network Group deletion
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {object} orgaIdOrName The owner ID or name
 * @throws {Error} If the Network Group is not found
 */
export async function destroy(ngIdOrLabel, orgaIdOrName) {
  const [found] = await searchNgOrResource(ngIdOrLabel, orgaIdOrName, 'NetworkGroup');

  if (!found) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId ?? ngIdOrLabel.ngResourceLabel)} not found`);
  }

  Logger.info(`Deleting Network Group ${found.id} from owner ${found.ownerId}`);
  await clients.ccApi.send(new DeleteNetworkGroupCommand({ ownerId: found.ownerId, networkGroupId: found.id }));
  Logger.info(`Network Group ${found.id} deleted from owner ${found.ownerId}`);
}

/**
 * Get the WireGuard configuration of a Network Group peer
 * @param {object} peerIdOrLabel The Peer ID or Label
 * @param {object} ngIdOrLabel The Network Group ID or Label
 * @param {object} orgaIdOrName The owner ID or name
 * @returns {Promise<string>} The Peer WireGuard configuration
 * @throws {Error} If the Peer is not found
 * @throws {Error} If the Network Group is not found
 * @throws {Error} If the Peer is not in the Network Group
 */
export async function getPeerConfig(peerIdOrLabel, ngIdOrLabel, orgaIdOrName) {
  const [parentNg] = await searchNgOrResource(ngIdOrLabel, orgaIdOrName, 'NetworkGroup');

  if (!parentNg) {
    throw new Error(`Network Group ${styleText('red', ngIdOrLabel.ngId ?? ngIdOrLabel.ngResourceLabel)} not found`);
  }

  const [peer] = await searchNgOrResource(peerIdOrLabel, orgaIdOrName, 'Peer');

  // peer.id is catched as a ngResourceLabel as it's a string with no distinctive prefix for now, it will change from API
  if (
    !peer ||
    (peerIdOrLabel.ngResourceLabel &&
      peerIdOrLabel.ngResourceLabel !== peer.label &&
      peerIdOrLabel.ngResourceLabel !== peer.id)
  ) {
    throw new Error(`Peer ${styleText('red', peerIdOrLabel.ngResourceLabel ?? peerIdOrLabel.member)} not found`);
  }

  if (!parentNg.peers.find((p) => p.id === peer.id)) {
    throw new Error(`Peer ${styleText('red', peer.id)} is not in Network Group ${styleText('red', parentNg.id)}`);
  }

  Logger.debug(`Getting configuration for Peer ${peer.id}`);
  const result = await tolerateNotFound(
    clients.ccApi.send(
      new GetNetworkGroupWireguardConfigurationCommand({
        ownerId: parentNg.ownerId,
        networkGroupId: parentNg.id,
        peerId: peer.id,
      }),
    ),
  );

  if (result == null) {
    throw new Error(
      `No WireGuard configuration found for Peer ${styleText('red', peer.id)} in Network Group ${styleText('red', parentNg.id)}`,
    );
  }

  Logger.debug(`Received from API:\n${result}`);

  return result;
}

/**
 * Get all Network Groups from an owner with members and peers
 * @param {string} orgaIdOrName The owner ID or name
 * @returns {Promise<Array<Object>>} The Network Groups
 */
export async function getAllNGs(orgaIdOrName) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgaIdOrName);

  Logger.info(`Listing Network Groups from owner ${ownerId}`);
  const result = await clients.ccApi.send(new ListNetworkGroupCommand({ ownerId }));
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
export async function searchNgOrResource(idOrLabel, orgaIdOrName, type = 'all', exactMatch = true) {
  const ownerId = await getOwnerIdFromOrgIdOrName(orgaIdOrName);

  // If idOrLabel is a string we use it, or we look through multiple keys
  const query =
    typeof idOrLabel === 'string' ? idOrLabel : (idOrLabel.ngId ?? idOrLabel.memberId ?? idOrLabel.ngResourceLabel);

  let types;
  switch (type) {
    case 'all':
    case 'single':
      break;
    case 'Peer':
      types = ['CleverPeer', 'ExternalPeer'];
      break;
    case 'CleverPeer':
    case 'ExternalPeer':
    case 'Member':
    case 'NetworkGroup':
      types = [type];
      break;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }

  let filtered = await clients.ccApi.send(new SearchNetworkGroupCommand({ ownerId, query, types }));

  if (exactMatch) {
    filtered = filtered.filter((f) => f.id === query || f.label === query);
  }

  if (filtered.length > 1 && type !== 'all') {
    throw new Error(`Multiple resources found for ${styleText('red', query)}, use ID instead:
${filtered.map((f) => ` • ${f.id} ${styleText('grey', `(${f.domainName || f.label} - ${f.type})`)}`).join('\n')}`);
  }

  // Deduplicate results
  return filtered.filter((item, index, array) => array.findIndex((element) => element.id === item.id) === index);
}

/**
 * Poll a Network Group until all the given members are linked to it
 * @param {string} ownerId The owner ID
 * @param {string} ngId The Network Group ID
 * @param {Array<string>} memberIds The members IDs to wait for
 * @throws {Error} When timeout is reached
 * @returns {Promise<void>}
 */
async function waitForMembers(ownerId, ngId, memberIds) {
  Logger.info(`Polling Network Group ${ngId} from owner ${ownerId}`);

  const polling = new Polling(
    async () => {
      const ng = await tolerateNotFound(
        clients.ccApi.send(new GetNetworkGroupCommand({ ownerId, networkGroupId: ngId })),
      );
      const members = ng?.members.filter((member) => memberIds.includes(member.id)) ?? [];

      if (members.length === memberIds.length) {
        return { stop: true };
      }

      Logger.debug(`Waiting for members: ${memberIds.join(', ')}`);
      return { stop: false };
    },
    POLLING_INTERVAL_MS,
    POLLING_TIMEOUT_MS,
  );

  try {
    await polling.start();
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(`Timeout while checking creation of Network Group ${ngId}`);
    }
    throw error;
  }
}
