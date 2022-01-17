'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');

async function listMembers(params) {
  const { ng: ngIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const owner_id = await NetworkGroup.getOwnerId();
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  Logger.info(`Listing members from Network Group '${ngId}'`);
  const result = await ngApi.listNetworkGroupMembers({ owner_id, ng_id }).then(sendToApi);

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
  const { ng: ngIdOrLabel, 'member-id': member_id, 'natural-name': naturalName, json } = params.options;
  const owner_id = await NetworkGroup.getOwnerId();
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(member_id)} in Network Group ${Formatter.formatString(ngId)}`);
  const result = await ngApi.getNetworkGroupMember({ owner_id, ng_id, member_id }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    await TableFormatter.printMembersTableHeader(naturalName);
    Logger.println(await TableFormatter.formatMembersLine(result, naturalName));
  }
}

async function addMember(params) {
  const { ng: ngIdOrLabel, 'member-id': member_id, type, 'domain-name': domainName, label } = params.options;
  const owner_id = await NetworkGroup.getOwnerId();
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  const body = { id: member_id, label, domain_name: domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupMember({ owner_id, ng_id }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(member_id)} to Network Group ${Formatter.formatString(ng_id)}.`);
}

async function removeMember(params) {
  const { ng: ngIdOrLabel, 'member-id': member_id } = params.options;
  const owner_id = await NetworkGroup.getOwnerId();
  const ng_id = await NetworkGroup.getId(owner_id, ngIdOrLabel);

  await ngApi.deleteNetworkGroupMember({ owner_id, ng_id, member_id }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(member_id)} from Network Group ${Formatter.formatString(ng_id)}.`);
}

module.exports = {
  listMembers,
  getMember,
  addMember,
  removeMember,
};
