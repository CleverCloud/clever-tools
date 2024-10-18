import { Logger } from '../logger.js';
import * as NetworkGroup from '../models/ng.js';
import * as Formatter from '../models/format-string.js';
import * as ngApi from '@clevercloud/client/cjs/api/v4/network-group.js';

import { v4 as uuidv4 } from 'uuid';
import { sendToApi } from '../models/send-to-api.js';

const TIMEOUT = 5000;
const INTERVAL = 500;

export async function listNg (params) {
  const { org: orgaIdOrName, alias, format } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);

  Logger.info(`Listing Network Groups from owner ${Formatter.formatString(ownerId)}`);
  const result = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
  Logger.debug(`Received from API: ${JSON.stringify(result, null, 2)}`);

  if (result.length === 0) {
    Logger.println(`No Network Group found for ${ownerId}`);
    Logger.println(`You can create one with ${Formatter.formatCommand('clever networkgroups create')} command`);
    return;
  }

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(result, null, 2));
      break;
    }
    case 'human':
    default: {
      // We keep only id, label, networkIp, lastAllocatedIp
      const ngList = result.map(({
        id, label, networkIp, lastAllocatedIp, members, peers,
      }) => ({
        id, label, networkIp, lastAllocatedIp, members: Object.keys(members).length, peers: Object.keys(peers).length,
      }));

      console.table(ngList);
    }
  }
}

export async function createNg (params) {
  const [label] = params.args;
  const { org: orgaIdOrName, alias, description, tags, format, 'members-ids': members_ids } = params.options;

  // We generate and set a unique ID to know it before the API call and reuse it later
  const ngId = `ng_${uuidv4()}`;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);

  let members = [];
  if (members_ids) {
    // For each member ID, we add a type depending on the ID format and a domain name
    members = members_ids.map((id) => {

      const domainName = `${id}.m.${ngId}.ng.clever-cloud.com`;
      const prefixToType = {
        app_: 'application',
        addon_: 'addon',
        external_: 'external',
      };

      const prefix = Object.keys(prefixToType)
        .find((p) => id.startsWith(p));

      let type = prefixToType[prefix];
      if (!type) {
        // throw new Error(`Member ID ${Formatter.formatString(id)} is not a valid format. It should start with 'app_', 'addon_' or 'external_'`);
        type = 'addon';
      }
      return { id, domainName, type };
    });
  }

  const body = { ownerId: ownerId, id: ngId, label, description, tags, members };
  Logger.info(`Creating Network Group ${Formatter.formatString(label)} (${Formatter.formatId(ngId)}) from owner ${Formatter.formatString(ownerId)}`);
  Logger.info(`${members.length} members will be added: ${members.map((m) => Formatter.formatString(m.id)).join(', ')}`);
  Logger.debug(`Sending body: ${JSON.stringify(body, null, 2)}`);
  await ngApi.createNetworkGroup({ ownerId }, body).then(sendToApi);

  // We poll until NG is created to display the result
  const polling = setInterval(async () => {
    const ng = await ngApi.getNetworkGroup({ ownerId, networkGroupId: ngId }).then(sendToApi).catch(() => {
      Logger.error(`Error while fetching Network Group ${Formatter.formatString(ngId)}`);
      process.exit(1);
    });

    Logger.debug(`Received from API during polling: ${JSON.stringify(ng, null, 2)}`);

    if (ng.label === label) {
      clearInterval(polling);
      clearTimeout(timeout);

      const message = format === 'json'
        ? JSON.stringify(ng, null, 2)
        : `Network Group ${Formatter.formatString(label)} (${Formatter.formatId(ngId)}) has been created successfully`;

      Logger.println(message);
    }
  }, INTERVAL);

  const timeout = setTimeout(() => {
    clearInterval(polling);
    Logger.error('Network group creation has been launched asynchronously but timed out. Check the status later with `clever ng list`.');
  }, TIMEOUT);
}

export async function deleteNg (params) {
  const [networkGroupIdOrLabel] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Deleting Network Group ${Formatter.formatString(networkGroupId)} from owner ${Formatter.formatString(ownerId)}`);
  await ngApi.deleteNetworkGroup({ ownerId, networkGroupId }).then(sendToApi);

  // We poll until NG is deleted to display the result
  const polling = setInterval(async () => {
    const ngList = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
    const ng = ngList.find((ng) => ng.id === networkGroupId);

    Logger.debug(`Received from API during polling: ${JSON.stringify(ng, null, 2)}`);

    if (!ng) {
      clearInterval(polling);
      clearTimeout(timeout);

      Logger.println(`Network Group ${Formatter.formatString(networkGroupId)} has been deleted successfully`);
    }
  }, INTERVAL);

  const timeout = setTimeout(() => {
    clearInterval(polling);
    Logger.error('Network group deletion has been launched asynchronously but timed out. Check the status later with `clever ng list`.');
  }, TIMEOUT);
}

export async function listMembers (params) {
  const [networkGroupIdOrLabel] = params.args;
  const { org: orgaIdOrName, alias, 'natural-name': naturalName, format } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Listing members from Network Group '${networkGroupId}'`);
  Logger.info(naturalName);

  const result = await ngApi.listNetworkGroupMembers({ ownerId, networkGroupId }).then(sendToApi);
  Logger.debug(`Received from API: ${JSON.stringify(result, null, 2)}`);

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(result, null, 2));
      break;
    }
    case 'human':
    default: {
      if (result.length === 0) {
        Logger.println(`No member found. You can add one with ${Formatter.formatCommand('clever networkgroups members add')}.`);
      }
      else {
        const domainNames = result.map((item) => ({ domainName: item.domainName }));
        console.table(domainNames);
      }
    }
  }
}

export async function getMember (params) {
  const [networkGroupIdOrLabel, memberId] = params.args;
  const { org: orgaIdOrName, alias, 'natural-name': naturalName, format } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(memberId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  Logger.info(`Natural name: ${naturalName}`);
  const result = await ngApi.getNetworkGroupMember({ ownerId, networkGroupId, memberId: memberId }).then(sendToApi);
  Logger.debug(`Received from API: ${JSON.stringify(result, null, 2)}`);

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(result, null, 2));
      break;
    }
    case 'human':
    default: {
      const domainName = [result].map((item) => ({ domainName: item.domainName }));
      console.table(domainName);
    }
  }
}

export async function addMember (params) {
  const [networkGroupIdOrLabel, memberId] = params.args;
  const { org: orgaIdOrName, alias, label } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);
  const domainName = `${memberId}.m.${networkGroupId}.ng.clever-cloud.com`;

  let type = null;
  if (memberId.startsWith('app_')) {
    type = 'application';
  }
  else if (memberId.startsWith('addon_')) {
    type = 'addon';
  }
  else if (memberId.startsWith('external_')) {
    type = 'external';
  }
  else {
    // throw new Error(`Member ID ${Formatter.formatString(memberId)} is not a valid format. It should start with 'app_', 'addon_' or 'external_'`);
    type = 'addon';
  }

  const body = { id: memberId, label, domainName: domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupMember({ ownerId, networkGroupId }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(memberId)} to Network Group ${Formatter.formatString(networkGroupId)}.`);
}

export async function removeMember (params) {
  const [networkGroupIdOrLabel, memberId] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  await ngApi.deleteNetworkGroupMember({ ownerId, networkGroupId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(memberId)} from Network Group ${Formatter.formatString(networkGroupId)}.`);
}

export async function listPeers (params) {
  const [networkGroupIdOrLabel] = params.args;
  const { org: orgaIdOrName, alias, format } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Listing peers from Network Group ${Formatter.formatString(networkGroupId)}`);
  const result = await ngApi.listNetworkGroupPeers({ ownerId, networkGroupId }).then(sendToApi);
  Logger.debug(`Received from API: ${JSON.stringify(result, null, 2)}`);

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(result, null, 2));
      break;
    }
    case 'human':
    default: {
      if (result.length === 0) {
        Logger.println(`No peer found. You can add an external one with ${Formatter.formatCommand('clever networkgroups peers add-external')}.`);
      }
      else {
        const peersList = result.map(({
          id, label, endpoint, type,
        }) => ({
          id, label, 'host:ip': `${endpoint.ngTerm.host}:${endpoint.ngTerm.port}`, 'peer.type': type, 'endpoint.type': endpoint.type,
        }));
        console.table(peersList);
      }
    }
  }
}

export async function getPeer (params) {
  const [networkGroupIdOrLabel, peerId] = params.args;
  const { org: orgaIdOrName, alias, format } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  const peer = await ngApi.getNetworkGroupPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);
  Logger.debug(`Received from API: ${JSON.stringify(peer, null, 2)}`);

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(peer, null, 2));
      break;
    }
    case 'human':
    default: {
      // We keep only id, label, 'host:ip': `${endpoint.ngTerm.host}:${endpoint.ngTerm.port}`, type
      const peerList = { id: peer.id, label: peer.label, 'host:ip': `${peer.endpoint.ngTerm.host}:${peer.endpoint.ngTerm.port}`, type: peer.type };
      console.table([peerList]);
    }
  }
}

export async function addExternalPeer (params) {
  const { org: orgaIdOrName, alias, format, 'public-key': publicKey, ip, port } = params.options;
  const [networkGroupIdOrLabel, label, role, parent] = params.args;
  console.log(params.args);
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  const body = { peerRole: role, publicKey: publicKey, label, parentMember: parent };
  Logger.info(`Adding external peer to Network Group ${Formatter.formatString(networkGroupId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peerId } = await ngApi.createNetworkGroupExternalPeer({ ownerId, networkGroupId }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been added to Network Group ${Formatter.formatString(networkGroupId)}.`);
  return peerId;
}

export async function removeExternalPeer (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'peer-id': peerId } = params.options;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from Network Group ${Formatter.formatString(networkGroupId)}`);
  await ngApi.deleteNetworkGroupExternalPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from Network Group ${Formatter.formatString(networkGroupId)}.`);
}
