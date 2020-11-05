'use strict';

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

const { sendToApi } = require('../models/send-to-api.js');

async function listNetworkgroups (params) {
  const { alias, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });
  Logger.debug(`Get networkgroups for the ownerId: ${ownerId}`);
  const result = await networkgroup.get({ owner_id: ownerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  } else {
    for (const ng of result) {
      Logger.println(ng.id, '|', ng.label, '|', ng.description);
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
  } else {
    Logger.println('Networkgroup is created with this id:', result.id);
  }
}

async function deleteNg (params) {
  const { alias, 'ng-id': ng_id } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });
  Logger.debug(`Get networkgroups for the ownerId: ${ownerId}`);
  const result = await networkgroup.deleteNg({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  Logger.println('Networkgroup is deleted');
}

async function listMembers (params) {
  const { alias, 'ng-id': ng_id, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.listMembers({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  } else {
    Logger.println('Networkgroup contains theses members :');
    Logger.println("id | member type | label | domain name");
    for (const member of result) {
      Logger.println(member.id, '|', member.type, '|', member.label, '|', member['domain-name']);
    }
  }
}

async function getMember (params) {
  const { alias, 'ng-id': ng_id, json, 'member-id': memberId } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.getMember({ owner_id: ownerId, ngId: ng_id, memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  } else {
    Logger.println("id | member type | label | domain name");
    Logger.println(result.id, '|', result.type, '|', result.label, '|', result['domain-name']);
  }
}

async function addMember (params) {
  const { alias, 'ng-id': ng_id, 'app-id': app_id } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.addMember({ owner_id: ownerId, id: ng_id }, { id: app_id, label, 'domain-name': domainName, 'type': mtype }).then(sendToApi);

  Logger.println('add member : OK');
}

async function removeMember (params) {
  const { alias, 'ng-id': ng_id, 'member-id': memberId } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.removeMember({ owner_id: ownerId, ngId: ng_id, memberId }).then(sendToApi);

  Logger.println('remove member : OK');
}

async function listPeers (params) {
  const { alias, 'ng-id': ng_id, json } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.listPeers({ owner_id: ownerId, id: ng_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  } else {
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
  } else {
    const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint['ng-term'].ip : peer.endpoint['ng-ip'];
    Logger.println(peer.id, '|', peer.type, '|', peer.endpoint.type, '|', peer.label, '|', peer.hostname, '|', ip);
  }
}

async function removeExternalPeer (params) {
  const { alias, 'ng-id': ng_id, 'peer-id': peerId } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const result = await networkgroup.removeExternalPeer({ owner_id: ownerId, ngId: ng_id, peerId }).then(sendToApi);

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
