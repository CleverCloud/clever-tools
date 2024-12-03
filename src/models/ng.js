import colors from 'colors/safe.js';
import * as User from '../models/user.js';
import * as Organisation from '../models/organisation.js';
import * as ngApi from '@clevercloud/client/cjs/api/v4/network-group.js';

import { sendToApi } from './send-to-api.js';
import { Logger } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

export const TIMEOUT = 5000;
export const INTERVAL = 500;
export const DOMAIN = 'ng-cc.cloud';
export const TYPE_PREFIXES = {
  app_: 'application',
  addon_: 'addon',
  external_: 'external',
};

/**
 * Construct members from members_ids
 * @param {Array<string>} members_ids
 * @returns {Array<Object>} Array of members with id, domainName and type
 */
export function constructMembers (ngId, membersIds) {
  return membersIds.map((id) => {
    const domainName = `${id}.m.${ngId}.${DOMAIN}`;
    const prefixToType = TYPE_PREFIXES;

    return {
      id,
      domainName,
      // Get type from prefix match in id (app_*, addon_*, external_*) or default to 'application'
      type: prefixToType[Object.keys(prefixToType).find((p) => id.startsWith(p))]
        || 'application',
    };
  });
}

/**
 * Ask for a Network Group creation
 * @param {string} orgaIdOrName The owner ID or name
 * @param {string} label The Network Group label
 * @param {string} description The Network Group description
 * @param {string} tags The Network Group tags
 * @param {Array<string>} membersIds The Network Group members IDs
 */
export async function create (orgaIdOrName, label, description, tags, membersIds) {
  const id = `ng_${uuidv4()}`;
  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  const members = constructMembers(id, membersIds || []);
  const body = { ownerId, id, label, description, tags, members };

  Logger.info(`Creating Network Group ${label} (${id}) from owner ${ownerId}`);
  Logger.info(`${members.length} members will be added: ${members.map((m) => m.id).join(', ')}`);
  Logger.debug(`Sending body: ${JSON.stringify(body, null, 2)}`);
  await ngApi.createNetworkGroup({ ownerId }, body).then(sendToApi);

  await pollNetworkGroup(ownerId, id, { waitForMembers: membersIds });
  Logger.info(`Network Group ${label} (${id}) created from owner ${ownerId}`);
  return { id, ownerId };
}

export async function destroy (ngIdOrLabel, orgaIdOrName) {
  const found = await getNgOrRessource(ngIdOrLabel, orgaIdOrName);

  if (found.type !== 'ng') {
    throw new Error('You need to specify a Network Group ID or label');
  }

  await ngApi.deleteNetworkGroup({ ownerId: found.item.ownerId, networkGroupId: found.item.id }).then(sendToApi);
  Logger.info(`Deleting Network Group ${found.item.id} from owner ${found.item.ownerId}`);
  await pollNetworkGroup(found.item.ownerId, found.item.id, { waitForDeletion: true });
  Logger.info(`Network Group ${found.item.id} deleted from owner ${found.item.ownerId}`);
}

export async function getConfig (ngIdOrLabel, orgaIdOrName) {
  const found = await getNgOrRessource(ngIdOrLabel, orgaIdOrName);

  if (found.type !== 'peer') {
    throw new Error('You need to specify a Peer ID or label');
  }

  Logger.debug(`Getting configuration for Network Group ${found.item.id} of owner ${found.ownerId}`);
  const result = await ngApi.getNetworkGroupWireGuardConfiguration({
    ownerId: found.ownerId,
    networkGroupId: found.parentNgId,
    peerId: found.item.id,
  }).then(sendToApi);
  Logger.debug(`Received from API:\n${JSON.stringify(result, null, 2)}`);

  return result;
}

/**
 * Get Network Groups from an owner
 * @param {string} orgaIdOrName The owner ID or name
 * @returns {Promise<Array<Object>>} The Network Groups
 */
export async function getNGs (orgaIdOrName) {
  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  Logger.info(`Listing Network Groups from owner ${ownerId}`);
  const result = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
  Logger.debug(`Received from API:\n${JSON.stringify(result, null, 2)}`);
  return result;
}

/**
 * Get a Network Group or a member/peer
 * @param {string|Object} IdOrLabel The Network Group ID or label, or a member/peer ID or label
 * @param {string} orgaIdOrName The owner ID or name
 * @throws {Error} If no Network Group or member/peer is found
 * @throws {Error} If multiple Network Groups or member/peer are found
 * @returns {Promise<Object>} The Network Group or a member/peer { type: 'ng' | 'member' | 'peer', item: Object, ownerId: string, parentNgId: string }

 */
export async function getNgOrRessource (IdOrLabel, orgaIdOrName) {
  const ngs = await getNGs(orgaIdOrName);

  let searchString = typeof IdOrLabel === 'string' ? IdOrLabel : null;
  if (!searchString) {
    searchString = IdOrLabel.ngId
      || IdOrLabel.ngLabel
      || IdOrLabel.memberId
      || IdOrLabel.peerId
      || IdOrLabel.externalPeerId
      || IdOrLabel.ngRessourceLabel;
  }

  const foundItems = ngs.reduce((results, ng) => {
    if (ng.id === searchString || ng.label === searchString) {
      Logger.debug(`Found Network Group ${ng.id}`);
      results.push({ type: 'ng', item: ng });
    }

    const items = [
      ...ng.members.map((m) => ({ type: 'member', parentNgId: ng.id, ownerId: ng.ownerId, item: m })),
      ...ng.peers.map((p) => ({ type: 'peer', parentNgId: ng.id, ownerId: ng.ownerId, item: p })),
    ];

    // TODO: Move this to the API response
    // We add the peers to the corresponding members
    ng.members.forEach((member) => {
      member.peers = ng.peers.filter((peer) => peer.parentMember === member.id);
    });

    items.forEach((found) => {
      if (found.item.id === searchString || found.item.label === searchString) {
        Logger.debug(`Found ${found.type} ${found.item.id} in Network Group ${ng.id}`);
        results.push(found);
      }
    });

    return results;
  }, []);

  Logger.debug(`Found items:\n${JSON.stringify(foundItems, null, 2)}`);

  if (foundItems.length === 0) {
    throw new Error(`No network group or resource found for ${colors.red(searchString)}`);
  }

  // We deduplicate results, as same ID/Label can be found in multiple Network Groups
  const deduplicatedFoundItems = foundItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.item.id === item.item.id && t.item.label === item.item.label),
  );

  if (deduplicatedFoundItems.length > 1) {
    throw new Error(`Multiple ressources found for ${colors.red(searchString)}, use ID instead:
${foundItems.map((found) => colors.grey(` - ${found.item.id} (${found.item.label} - ${found.type} - ${found.parentNgId})`)).join('\n')}`);
  }

  return deduplicatedFoundItems[0];
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

    const poll = setInterval(async () => {
      const ngs = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
      const ng = ngs.find((ng) => ng.id === ngId);

      // Pour la suppression, on attend que le NG ne soit plus présent
      if (waitForDeletion && !ng) {
        cleanup(true);
        return;
      }

      // Pour la création, on attend que le NG soit présent
      if (!waitForDeletion && ng) {
        // Si on attend des membres spécifiques
        if (waitForMembers?.length) {
          const members = ng.members.filter((member) => waitForMembers.includes(member.id));
          if (members.length !== waitForMembers.length) {
            Logger.debug(`Waiting for members: ${waitForMembers.join(', ')}`);
            return;
          }
        }
        cleanup(true);
      }
    }, INTERVAL);

    const timer = setTimeout(() => {
      const action = waitForDeletion ? 'deletion of' : 'creation of';
      cleanup(false, new Error(`Timeout while checking ${action} Network Group ${ngId}`));
    }, TIMEOUT);

    function cleanup (success, error = null) {
      clearInterval(poll);
      clearTimeout(timer);
      success ? resolve() : reject(error);
    }
  });
}
