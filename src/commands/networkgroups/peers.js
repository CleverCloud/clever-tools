'use strict';

const client = require('@clevercloud/client/cjs/api/v4/networkgroup.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const Networkgroup = require('../../models/networkgroup.js');
const Formatter = require('./format-string.js');
const TableFormatter = require('./format-table.js');

async function listPeers (params) {
  const { ng: ngIdOrLabel, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Listing peers from networkgroup ${Formatter.formatString(ngId)}`);
  const result = await client.listPeers({ ownerId, ngId }).then(sendToApi);

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
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in networkgroup ${Formatter.formatString(ngId)}`);
  const peer = await client.getPeer({ ownerId, ngId, peerId }).then(sendToApi);

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
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const body = { 'peer-role': role, 'public-key': publicKey, label, parent_member: parent, ip, port };
  Logger.info(`Adding external peer to networkgroup ${Formatter.formatString(ngId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peerId } = await client.addExternalPeer({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been added to networkgroup ${Formatter.formatString(ngId)}.`);
  return peerId;
}

async function removeExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from networkgroup ${Formatter.formatString(ngId)}`);
  // FIXME: Currently, when an external peer is already deleted, the API returns 404.
  //        This is detected as an error status code and throws an error.
  //        This prevents `clever ng leave` from working correctly in some cases.
  //        This status code will be changed to 204 soon.
  await client.removeExternalPeer({ ownerId, ngId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from networkgroup ${Formatter.formatString(ngId)}.`);
}

module.exports = {
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
