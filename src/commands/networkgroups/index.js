'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listNetworkGroups(params) {
  const { 'owner-id': ownerId, alias, json } = params.options;
  const validOwnerId = await NetworkGroup.getOwnerId(ownerId, alias);
  Logger.info(`Listing Network Groups from owner ${Formatter.formatString(validOwnerId)}`);
  const result = await ngApi.listNetworkGroups({ ownerId: validOwnerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No Network Group found. You can create one with ${Formatter.formatCommand('clever networkgroups create')}.`);
    }
    else {
      TableFormatter.printNetworkGroupsTableHeader();
      result
        .map((ng) => TableFormatter.formatNetworkGroupsLine(ng))
        .forEach((ng) => Logger.println(ng));
    }
  }
}

async function createNg(params) {
  const { 'owner-id': ownerId, alias, label, description, tags, json } = params.options;
  const validOwnerId = await NetworkGroup.getOwnerId(ownerId, alias);

  Logger.info(`Creating Network Group from owner ${Formatter.formatString(validOwnerId)}`);
  const body = { validOwnerId: validOwnerId, label, description, tags };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const result = await ngApi.createNetworkGroup({ ownerId: validOwnerId }, body).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println(`Network Group ${Formatter.formatString(label)} creation will be performed asynchronously.`);
  }
}

async function deleteNg(params) {
  const { 'owner-id': ownerId, alias, ng: networkGroupIdOrLabel } = params.options;
  const validOwnerId = await NetworkGroup.getOwnerId(ownerId, alias);
  const networkGroupId = await NetworkGroup.getId(validOwnerId, networkGroupIdOrLabel);

  Logger.info(`Deleting Network Group ${Formatter.formatString(networkGroupId)} from owner ${Formatter.formatString(validOwnerId)}`);
  await ngApi.deleteNetworkGroup({ validOwnerId, networkGroupId }).then(sendToApi);

  Logger.println(`Network Group ${Formatter.formatString(networkGroupId)} deletion will be performed asynchronously.`);
}

module.exports = {
  listNetworkGroups,
  createNg,
  deleteNg,
};
