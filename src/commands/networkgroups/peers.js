'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listPeers(params) {
  const { org: orgaIdOrName, alias, ng: ngIdOrLabel, json } = params.options;
  const owner_id = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  Logger.info(`Listing peers from Network Group ${Formatter.formatString(ng_id)}`);
  const result = await ngApi.listNetworkGroupPeers({ owner_id, ng_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No peer found. You can add an external one with ${Formatter.formatCommand('clever networkgroups peers add-external')}.`);
    }
    else {
      TableFormatter.printPeersTableHeader();
      result.forEach((peer) => {
        Logger.println(TableFormatter.formatPeersLine(peer));
      });
    }
  }
}

async function getPeer(params) {
  const { org: orgaIdOrName, alias, ng: ngIdOrLabel, 'peer-id': peer_id, json } = params.options;
  const owner_id = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const ng_id = await NetworkGroup.get(owner_id, ngIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peer_id)} in Network Group ${Formatter.formatString(ng_id)}`);
  const peer = await ngApi.getNetworkGroupPeer({ owner_id, ng_id, peer_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    TableFormatter.printPeersTableHeader();
    Logger.println(TableFormatter.formatPeersLine(peer));
  }
}

async function addExternalPeer(params) {
  const { org: orgaIdOrName, alias, ng: ngIdOrLabel, role, 'public-key': publicKey, label, parent, ip, port } = params.options;
  const owner_id = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  const body = { peer_role: role, public_key: publicKey, label, parent_member: parent, ip, port };
  Logger.info(`Adding external peer to Network Group ${Formatter.formatString(ng_id)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peer_id } = await ngApi.createNetworkGroupExternalPeer({ owner_id, ng_id }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peer_id)} must have been added to Network Group ${Formatter.formatString(ng_id)}.`);
  return peer_id;
}

async function removeExternalPeer(params) {
  const { org: orgaIdOrName, alias, ng: ngIdOrLabel, 'peer-id': peer_id } = params.options;
  const owner_id = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peer_id)} from Network Group ${Formatter.formatString(ng_id)}`);
  await ngApi.deleteNetworkGroupExternalPeer({ owner_id, ng_id, peer_id }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peer_id)} must have been removed from Network Group ${Formatter.formatString(ng_id)}.`);
}

module.exports = {
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
