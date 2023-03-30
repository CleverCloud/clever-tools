'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');
const { displayAlphaBanner } = require('../../lib/banner.js');

async function listPeers (params) {

  displayAlphaBanner();

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
      TableFormatter.printPeersTableHeader();
      result.forEach((peer) => {
        Logger.println(TableFormatter.formatPeersLine(peer));
      });
    }
  }
}

async function getPeer (params) {

  displayAlphaBanner();

  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  const peer = await ngApi.getNetworkGroupPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    TableFormatter.printPeersTableHeader();
    Logger.println(TableFormatter.formatPeersLine(peer));
  }
}

async function addExternalPeer (params) {

  displayAlphaBanner();

  const {
    org: orgaIdOrName,
    alias,
    ng: networkGroupIdOrLabel,
    role,
    'public-key': publicKey,
    label,
    parent,
    ip,
    port,
  } = params.options;
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

  displayAlphaBanner();

  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from Network Group ${Formatter.formatString(networkGroupId)}`);
  await ngApi.deleteNetworkGroupExternalPeer({ ownerId, networkGroupId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from Network Group ${Formatter.formatString(networkGroupId)}.`);
}

module.exports = {
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
