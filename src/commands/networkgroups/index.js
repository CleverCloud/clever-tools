'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listNetworkGroups(params) {
  const { json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();

  Logger.info(`Listing Network Groups from owner ${Formatter.formatString(ownerId)}`);
  const result = await ngApi.get({ ownerId }).then(sendToApi);

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
  const { label, description, tags, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();

  Logger.info(`Creating Network Group from owner ${Formatter.formatString(ownerId)}`);
  const body = { owner_id: ownerId, label, description, tags };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const result = await ngApi.createNg({ ownerId }, body).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println(`Network Group ${Formatter.formatString(label)} was created with the id ${Formatter.formatString(result.id)}.`);
  }
}

async function deleteNg(params) {
  const { ng: ngIdOrLabel } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Deleting Network Group ${Formatter.formatString(ngId)} from owner ${Formatter.formatString(ownerId)}`);
  await ngApi.deleteNg({ ownerId, ngId }).then(sendToApi);

  Logger.println(`Network Group ${Formatter.formatString(ngId)} was successfully deleted.`);
}

module.exports = {
  listNetworkGroups,
  createNg,
  deleteNg,
};
