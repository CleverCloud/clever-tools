'use strict';

const ngApi = require('@clevercloud/client/cjs/api/v4/network-group.js');

const { sendToApi } = require('../../models/send-to-api.js');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const TableFormatter = require('../../models/format-ng-table.js');
const { displayAlphaBanner } = require('../../lib/banner.js');

async function listMembers (params) {

  displayAlphaBanner();

  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Listing members from Network Group '${networkGroupId}'`);
  const result = await ngApi.listNetworkGroupMembers({ ownerId, networkGroupId }).then(sendToApi);

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

async function getMember (params) {

  displayAlphaBanner();

  const {
    org: orgaIdOrName,
    alias,
    ng: networkGroupIdOrLabel,
    'member-id': memberId,
    'natural-name': naturalName,
    json,
  } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(memberId)} in Network Group ${Formatter.formatString(networkGroupId)}`);
  const result = await ngApi.getNetworkGroupMember({ ownerId, networkGroupId, memberId: memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    await TableFormatter.printMembersTableHeader(naturalName);
    Logger.println(await TableFormatter.formatMembersLine(result, naturalName));
  }
}

async function addMember (params) {

  displayAlphaBanner();

  const {
    org: orgaIdOrName,
    alias,
    ng: networkGroupIdOrLabel,
    'member-id': memberId,
    type,
    'domain-name': domainName,
    label,
  } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  const body = { id: memberId, label, domain_name: domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await ngApi.createNetworkGroupMember({ ownerId, networkGroupId }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(memberId)} to Network Group ${Formatter.formatString(networkGroupId)}.`);
}

async function removeMember (params) {

  displayAlphaBanner();

  const { org: orgaIdOrName, alias, ng: networkGroupIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId(orgaIdOrName, alias);
  const networkGroupId = await NetworkGroup.getId(ownerId, networkGroupIdOrLabel);

  await ngApi.deleteNetworkGroupMember({ ownerId, networkGroupId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(memberId)} from Network Group ${Formatter.formatString(networkGroupId)}.`);
}

module.exports = {
  listMembers,
  getMember,
  addMember,
  removeMember,
};
