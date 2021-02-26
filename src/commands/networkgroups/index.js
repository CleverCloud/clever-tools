'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/networkgroup.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const Networkgroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listNetworkgroups (params) {
  const { json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();

  Logger.info(`Listing networkgroups from owner ${Formatter.formatString(ownerId)}`);
  const result = await ngApi.get({ ownerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No networkgroup found. You can create one with ${Formatter.formatCommand('clever networkgroups create')}.`);
    }
    else {
      TableFormatter.printNetworkgroupsTableHeader();
      result
        .map((ng) => TableFormatter.formatNetworkgroupsLine(ng))
        .forEach((ng) => Logger.println(ng));
    }
  }
}

async function createNg (params) {
  const { label, description, tags, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();

  Logger.info(`Creating networkgroup from owner ${Formatter.formatString(ownerId)}`);
  const body = { owner_id: ownerId, label, description, tags };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const result = await ngApi.createNg({ ownerId }, body).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println(`Networkgroup ${Formatter.formatString(label)} was created with the id ${Formatter.formatString(result.id)}.`);
  }
}

async function deleteNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Deleting networkgroup ${Formatter.formatString(ngId)} from owner ${Formatter.formatString(ownerId)}`);
  await ngApi.deleteNg({ ownerId, ngId }).then(sendToApi);

  Logger.println(`Networkgroup ${Formatter.formatString(ngId)} was successfully deleted.`);
}

module.exports = {
  listNetworkgroups,
  createNg,
  deleteNg,
};
