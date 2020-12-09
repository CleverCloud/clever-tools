'use strict';

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');

const formatTable = require('../format-table');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

const { sendToApi } = require('../models/send-to-api.js');

// We use examples of maximum width text to have a clean display
const formatNetworkgroupsTable = formatTable([
  40, /* id length */
  20, /* label length */
  40, /* description */
]);

function formatNetworkgroupsLine (ng) {
  return formatNetworkgroupsTable([
    [
      ng.id,
      ng.label,
      ng.description || ' ',
    ],
  ]);
};

async function listNetworkgroups (params) {
  const { alias, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });
  Logger.debug(`Get networkgroups for the ownerId: ${ownerId}`);
  const result = await networkgroup.get({ owner_id: ownerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    const resultToPrint = result.map((ng) => formatNetworkgroupsLine(ng));
    Logger.println(formatNetworkgroupsLine({ id: 'Networkgroup Id', label: 'Label', description: 'Description' }));
    if (resultToPrint.length === 0) {
      Logger.println(' No networkgroups found');
    }
    else {
      for (const ng of resultToPrint) {
        Logger.println(ng);
      }
    }
  }
}

async function createNg (params) {
  const [label, description] = params.args;
  const { alias, 'ng-id': ng_id, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });
  Logger.debug(`Create networkgroup for the ownerId: ${ownerId}`);
  const result = await networkgroup.createNg({ owner_id: ownerId }, { id: ng_id, owner_id: ownerId, label, description }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println('Networkgroup is created with this id:', result.id);
  }
}

async function deleteNg (params) {
  const { alias, 'ng-id': ng_id } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });
  Logger.debug(`Get networkgroups for the ownerId: ${ownerId}`);
  await networkgroup.deleteNg({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  Logger.println('Networkgroup is deleted');
}

async function listMembers (params) {
  const { alias, 'ng-id': ng_id, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.listMembers({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println('Networkgroup contains theses members :');
    Logger.println('id | member type | label | domain name');
  }
}

async function getMember (params) {
  const { alias, 'ng-id': ng_id, json, 'member-id': memberId } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.getMember({ owner_id: ownerId, ngId: ng_id, memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println('id | member type | label | domain name');
    Logger.println(result.id, '|', result.type, '|', result.label, '|', result['domain-name']);
  }
}

async function addMember (params) {
  const { alias, 'ng-id': ng_id, 'app-id': app_id } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  await networkgroup.addMember({ owner_id: ownerId, id: ng_id }, { id: app_id, label, 'domain-name': domainName, type: mtype }).then(sendToApi);

  Logger.println('add member : OK');
}

async function removeMember (params) {
  const { alias, 'ng-id': ng_id, 'member-id': memberId } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  await networkgroup.removeMember({ owner_id: ownerId, ngId: ng_id, memberId }).then(sendToApi);

  Logger.println('remove member : OK');
}

async function listPeers (params) {
  const { alias, 'ng-id': ng_id, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.listPeers({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println('Networkgroup contains theses peers :');
    //  Logger.println("id | member type | label | domain name");
    for (const peer of result) {
      const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint['ng-term'].ip : peer.endpoint['ng-ip'];
      Logger.println(peer.id, '|', peer.type, '|', peer.endpoint.type, '|', peer.label, '|', peer.hostname, '|', ip);
    }
  }
}

async function getPeer (params) {
  const { alias, 'ng-id': ng_id, json, 'peer-id': peerId } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const peer = await networkgroup.getPeer({ owner_id: ownerId, ngId: ng_id, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint['ng-term'].ip : peer.endpoint['ng-ip'];
    Logger.println(peer.id, '|', peer.type, '|', peer.endpoint.type, '|', peer.label, '|', peer.hostname, '|', ip);
  }
}

async function removeExternalPeer (params) {
  const { alias, 'ng-id': ng_id, 'peer-id': peerId } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  await networkgroup.removeExternalPeer({ owner_id: ownerId, ngId: ng_id, peerId }).then(sendToApi);

  Logger.println('remove external peer : OK');
}

module.exports = {
  listNetworkgroups,
  createNg,
  deleteNg,
  listMembers,
  getMember,
  addMember,
  removeMember,
  listPeers,
  getPeer,
  removeExternalPeer,
};
