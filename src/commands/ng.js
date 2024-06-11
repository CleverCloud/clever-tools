'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');
const { v4: uuidv4 } = require('uuid');
const { sendToApi } = require('../models/send-to-api.js');

const Formatter = require('../models/format-string.js');
const Logger = require('../logger.js');
const NetworkGroup = require('../models/networkgroup.js');

const TIMEOUT = 5000;
const INTERVAL = 500;

async function listNg (params) {
  const { org: orgaIdOrName, alias, format } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);

  Logger.info(`Listing Network Groups from owner ${Formatter.formatString(ownerId)}`);
  const result = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);

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
      /* TableFormatter.printNetworkGroupsTableHeader();
      result
        .map((ng) => TableFormatter.formatNetworkGroupsLine(ng))
        .forEach((ng) => Logger.println(ng)); */
      // We keep only id, label, network_ip, last_allocated_ip
      const ngList = result.map(({ id, label, network_ip, last_allocated_ip, members, peers }) => ({ id, label, network_ip, last_allocated_ip, 'members': Object.keys(members).length, 'peers': Object.keys(peers).length }));
      console.table(ngList);
    }
  }
}

async function createNg (params) {
  const { org: orgaIdOrName, alias, description, tags, format, 'members-ids' : members_ids } = params.options;
  const [label] = params.args;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const ngId = `ng_${uuidv4()}`;

  let members = [];
  if (members_ids) {
    // For each member ID, we add a type depending on the ID format and a domain name
    members = members_ids.map((id) => {
      let type = 'application';
      let domain_name = `app_${id}.m.${ngId}.ng.clever-cloud.com`;

      if (id.startsWith('app_')) {
        type = 'application';
      }
      else if (id.startsWith('addon_')) {
        type = 'addon';
        domain_name = `${id}.m.${ngId}.ng.clever-cloud.com`;
      }
      else if (id.startsWith('external_')) {
        type = 'external';
        domain_name = `${id}.m.${ngId}.ng.clever-cloud.com`;
      }
      else {
        throw new Error (`Member ID ${Formatter.formatString(id)} is not a valid format. It should start with 'app_', 'addon_' or 'external_'`);
      }
      return { id, domain_name, type };
    });
  }

  const body = { ownerId: ownerId, id: ngId, label, description, tags, members };

  Logger.info(`Creating Network Group ${Formatter.formatString(label)} (${Formatter.formatId(ngId)}) from owner ${Formatter.formatString(ownerId)}`);
  Logger.info(`${members.length} members will be added: ${members.map((m) => Formatter.formatString(m.id)).join(', ')}`);
  Logger.debug(`Sending body: ${JSON.stringify(body, null, 2)}`);
  const result = await ngApi.createNetworkGroup({ ownerId }, body).then(sendToApi);

  // We poll until NG is created to display the result
  const polling = setInterval(async () => {
    const ng = await ngApi.getNetworkGroup({ ownerId, networkGroupId: ngId }).then(sendToApi);

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

async function deleteNg (params) {
  const { org: orgaIdOrName, alias, format } = params.options;
  const [networkGroupIdOrLabel] = params.args;

  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Deleting Network Group ${Formatter.formatString(networkGroupId)} from owner ${Formatter.formatString(ownerId)}`);
  const result = await ngApi.deleteNetworkGroup({ ownerId, networkGroupId }).then(sendToApi);

  // We poll until NG is deleted to display the result
  const polling = setInterval(async () => {
    const ngList = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
    const ng = ngList.find((ng) => ng.id === networkGroupId);

    if (!ng) {
      clearInterval(polling);
      clearTimeout(timeout);

      const message = format === 'json'
        ? JSON.stringify(result, null, 2)
        : `Network Group ${Formatter.formatString(networkGroupId)} has been deleted successfully`;

      Logger.println(message);
    }
  }, INTERVAL);

  const timeout = setTimeout(() => {
    clearInterval(polling);
    Logger.error('Network group deletion has been launched asynchronously but timed out. Check the status later with `clever ng list`.');
  }, TIMEOUT);
}

async function listMembers (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Listing members from Network Group '${networkGroupId}'`);
  Logger.info(naturalName);

  const result = await ngApi.listNetworkGroupMembers({ ownerId, networkGroupId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No member found. You can add one with ${Formatter.formatCommand('clever networkgroups members add')}.`);
    }
    else {
      result.forEach((member) => delete member.label);
      console.table(result);
    }
  }
}

async function getMember (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'member-id': memberId, 'natural-name': naturalName, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(memberId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  Logger.info(naturalName);
  const result = await ngApi.getNetworkGroupMember({ ownerId, networkGroupId, memberId: memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    delete result.label;
    console.table([result]);
  }
}

async function addMember (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'member-id': memberId, type, 'domain-name': domainName, label } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  const body = { id: memberId, label, domain_name: domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupMember({ ownerId, networkGroupId }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(memberId)} to Network Group ${Formatter.formatString(networkGroupId)}.`);
}

async function removeMember (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  await ngApi.deleteNetworkGroupMember({ ownerId, networkGroupId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(memberId)} from Network Group ${Formatter.formatString(networkGroupId)}.`);
}

async function listPeers (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Listing peers from Network Group ${Formatter.formatString(networkGroupId)}`);
  const result = await ngApi.listNetworkGroupPeers({ ownerId, networkGroupId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No peer found. You can add an external one with ${Formatter.formatCommand('clever networkgroups peers add-external')}.`);
    }
    else {
      const peersList = result.map(({ id, label, endpoint, type }) => ({ id, label, 'host:ip': `${endpoint.ngTerm.host}:${endpoint.ngTerm.port}`, 'peer.type': type, 'endpoint.type': endpoint.type }));
      console.table(peersList);

      /* TableFormatter.printPeersTableHeader();
      result.forEach((peer) => {
        Logger.println(TableFormatter.formatPeersLine(peer));
      }); */
    }
  }
}

async function getPeer (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  const peer = await ngApi.getNetworkGroupPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    // We keep only id, label, 'host:ip': `${endpoint.ngTerm.host}:${endpoint.ngTerm.port}`, type
    const peerList = { id: peer.id, label: peer.label, 'host:ip': `${peer.endpoint.ngTerm.host}:${peer.endpoint.ngTerm.port}`, type: peer.type };
    console.table([peerList]);
  }
}

async function addExternalPeer (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, role, 'public-key': publicKey, label, parent, ip, port } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  const body = { peer_role: role, public_key: publicKey, label, parent_member: parent, ip, port };
  Logger.info(`Adding external peer to Network Group ${Formatter.formatString(networkGroupId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peerId } = await ngApi.createNetworkGroupExternalPeer({ ownerId, networkGroupId }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been added to Network Group ${Formatter.formatString(networkGroupId)}.`);
  return peerId;
}

async function removeExternalPeer (params) {
  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from Network Group ${Formatter.formatString(networkGroupId)}`);
  await ngApi.deleteNetworkGroupExternalPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from Network Group ${Formatter.formatString(networkGroupId)}.`);
}

module.exports = {
  listNg,
  createNg,
  deleteNg,
  listMembers,
  getMember,
  addMember,
  removeMember,
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
