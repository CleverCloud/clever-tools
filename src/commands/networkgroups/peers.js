'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/networkgroup.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listPeers (params) {
  const { ng: ngIdOrLabel, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Listing peers from Network Group ${Formatter.formatString(ngId)}`);
  const result = await ngApi.listPeers({ ownerId, ngId }).then(sendToApi);

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
  const { ng: ngIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in Network Group ${Formatter.formatString(ngId)}`);
  const peer = await ngApi.getPeer({ ownerId, ngId, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    TableFormatter.printPeersTableHeader();
    Logger.println(TableFormatter.formatPeersLine(peer));
  }
}

async function addExternalPeer (params) {
  const { ng: ngIdOrLabel, role, 'public-key': publicKey, label, parent, ip, port } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  const body = { peer_role: role, public_key: publicKey, label, parent_member: parent, ip, port };
  Logger.info(`Adding external peer to Network Group ${Formatter.formatString(ngId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peerId } = await ngApi.addExternalPeer({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been added to Network Group ${Formatter.formatString(ngId)}.`);
  return peerId;
}

async function removeExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from Network Group ${Formatter.formatString(ngId)}`);
  await ngApi.removeExternalPeer({ ownerId, ngId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from Network Group ${Formatter.formatString(ngId)}.`);
}

module.exports = {
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
