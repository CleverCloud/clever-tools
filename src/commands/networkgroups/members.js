'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listMembers(params) {
  const { ng: ngIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Listing members from Network Group '${ngId}'`);
  const result = await ngApi.listMembers({ ownerId, ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No member found. You can add one with ${Formatter.formatCommand('clever networkgroups members add')}.`);
    }
    else {
      await TableFormatter.printMembersTableHeader(naturalName);
      for (const ng of result) {
        Logger.println(await TableFormatter.formatMembersLine(ng, naturalName));
      }
    }
  }
}

async function getMember(params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, 'natural-name': naturalName, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(memberId)} in Network Group ${Formatter.formatString(ngId)}`);
  const result = await ngApi.getMember({ ownerId, ngId, memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    await TableFormatter.printMembersTableHeader(naturalName);
    Logger.println(await TableFormatter.formatMembersLine(result, naturalName));
  }
}

async function addMember(params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, type, 'domain-name': domainName, label } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  const body = { id: memberId, label, domain_name: domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.addMember({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(memberId)} to Network Group ${Formatter.formatString(ngId)}.`);
}

async function removeMember(params) {
  const { ng: ngIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  await ngApi.removeMember({ ownerId, ngId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(memberId)} from Network Group ${Formatter.formatString(ngId)}.`);
}

module.exports = {
  listMembers,
  getMember,
  addMember,
  removeMember,
};
