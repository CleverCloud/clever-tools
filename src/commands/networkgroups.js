'use strict';

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { NetworkgroupStream } = require('@clevercloud/client/cjs/streams/networkgroup.node.js');

const formatTable = require('../format-table');
const { v4: uuidv4 } = require('uuid');
const prompts = require('prompts');
const { ngQuestions } = require('../models/questions');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const Networkgroup = require('../models/networkgroup.js');

const { sendToApi, getHostAndTokens } = require('../models/send-to-api.js');

function printSeparator (columnLengths) {
  Logger.println('-'.repeat(columnLengths.reduce((a, b) => a + b + 2)));
}

// We use examples of maximum width text to have a clean display
const networkgroupsTableColumnLengths = [
  40, /* id length */
  20, /* label length */
  40, /* description */
];
const formatNetworkgroupsTable = formatTable(networkgroupsTableColumnLengths);
function formatNetworkgroupsLine (ng) {
  return formatNetworkgroupsTable([
    [ng.id, ng.label, ng.description || ' '],
  ]);
};
function printNetworkgroupsTableHeader () {
  Logger.println(formatNetworkgroupsLine({
    id: 'Networkgroup ID',
    label: 'Label',
    description: 'Description',
  }));
  printSeparator(networkgroupsTableColumnLengths);
}

const membersTableColumnLengths = [
  40, /* id length */
  25, /* type length */
  40, /* label length */
  20, /* domain-name length */
  40, /* description */
];
const formatMembersTable = formatTable(membersTableColumnLengths);
async function formatMembersLine (member, showAliases = false) {
  return formatMembersTable([
    [
      showAliases ? await AppConfig.getMostNaturalName(member.id) : member.id,
      member.type, member.label,
      member['domain-name'] || ' ',
      member.description || ' ',
    ],
  ]);
};
async function printMembersTableHeader (naturalName = false) {
  Logger.println(await formatMembersLine({
    id: naturalName ? 'Member' : 'Member ID',
    type: 'Member Type',
    label: 'Label',
    'domain-name': 'Domain Name',
    description: 'Description',
  }));
  printSeparator(membersTableColumnLengths);
}

const peersTableColumnLengths = [
  45, /* id length */
  25, /* type length */
  25, /* endpoint type length */
  45, /* label length */
  20, /* hostname */
  16, /* ip */
];
const formatPeersTable = formatTable(peersTableColumnLengths);
function formatPeersLine (peer) {
  const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint['ng-term'].ip : peer.endpoint['ng-ip'];
  return formatPeersTable([
    [peer.id, peer.type, peer.endpoint.type, peer.label, peer.hostname, ip],
  ]);
};
function printPeersTableHeader () {
  Logger.println(formatPeersLine({
    id: 'Peer ID',
    type: 'Peer Type',
    endpoint: {
      type: 'Endpoint Type',
      'ng-ip': 'IP Address',
    },
    label: 'Label',
    hostname: 'Hostname',
  }));
  printSeparator(peersTableColumnLengths);
}

async function getOwnerId () {
  return (await AppConfig.getAppDetails({})).ownerId;
}

async function listNetworkgroups (params) {
  const { json } = params.options;
  const ownerId = await getOwnerId();

  Logger.debug(`Listing networkgroups from owner '${ownerId}'`);
  const result = await networkgroup.get({ ownerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println('No networkgroup found');
    }
    else {
      printNetworkgroupsTableHeader();
      const resultToPrint = result.map((ng) => formatNetworkgroupsLine(ng));
      for (const ng of resultToPrint) {
        Logger.println(ng);
      }
    }
  }
}

async function createNg (params) {
  let { label, description, tags, interactive, json } = params.options;
  const ownerId = await getOwnerId();

  // Ask for missing data if interactive
  if (interactive) {
    const questions = [];
    if (tags === null) {
      questions.push(ngQuestions.tags);
    }
    if (questions.length > 0) {
      const onCancel = (prompt) => {
        // Do not abort prompt loop on cancel
        return true;
      };
      const test1 = await prompts(questions, { onCancel });
      tags = tags ?? test1.ngTags;
    }
  }

  Logger.debug(`Creating networkgroup from owner '${ownerId}'`);
  const body = { owner_id: ownerId, label, description, tags };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const result = await networkgroup.createNg({ ownerId }, body).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println(`Networkgroup was created with the id '${result.id}'`);
  }
}

async function deleteNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Deleting networkgroup '${ngId}' from owner '${ownerId}'`);
  await networkgroup.deleteNg({ ownerId, ngId }).then(sendToApi);

  Logger.println(`Networkgroup '${ngId}' was successfully deleted`);
}

async function joinNg (params) {
  // FIXME: Allow join as server
  const [ngIdOrLabel] = params.args;
  const { 'public-key': publicKey, label, interactive } = params.options;
  let { 'node-category-id': parentId } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  let members = await networkgroup.listMembers({ ownerId, ngId }).then(sendToApi);
  members = members.filter((member) => {
    return member.type === 'externalNode';
  });

  if (parentId === null) {
    if (members.length === 0) {
      // Case 1: If there are no 'externalNode's, create a new one.
      Logger.println('You have to create an external node category (networkgroup member) to join a networkgroup.');
      parentId = 'new';
    }
    else {
      if (interactive) {
        // Case 2: If some 'externalNode's are already created, ask for selection (+ 'new' case).
        // - If selected, join with selected member as parent.
        // - If 'new', case 1.
        const result = await prompts({
          type: 'autocomplete',
          name: 'memberId',
          message: 'What category do you want to join?',
          choices: [
            ...members.map((m) => ({ title: m.label, value: m.id })),
            { title: 'Create new category', value: 'new' },
          ],
          initial: 0,
        });
        parentId = result.memberId;
      }
      else {
        Logger.println(`This networkgroup already has an external node category. Add \`--node-category-id ${members[0].id}\` to select it.`);
        return false;
      }
    }

    if (parentId === 'new') {
      if (interactive) {
        const result = await prompts([
          {
            type: 'text',
            name: 'memberLabel',
            message: 'How do you want to call it (label)?',
            // FIXME: Add real validation
            validate: (value) => true,
          },
          {
            type: 'text',
            name: 'domainName',
            message: 'What domain name do you want it to have?',
            // FIXME: Add real validation
            validate: (value) => true,
          },
        ]);
        const memberId = uuidv4();
        const { memberLabel, domainName } = result;
        await addMember({
          options: {
            ng: { ng_id: ngId },
            'member-id': memberId,
            type: 'external',
            'domain-name': domainName,
            label: memberLabel,
          },
        });
        parentId = memberId;
      }
      else {
        Logger.println('See `clever networkgroups members add` or add `--interactive` tag to create a new external member (node).');
        return false;
      }
    }
  }

  const peerId = `external_${uuidv4()}`;
  // Create new params keeping previous ones (e.g. verbose)
  const options = { ...params.options, ng: { ng_id: ngId }, 'peer-id': peerId, role: 'client', 'public-key': publicKey, label, parent: parentId };
  await addExternalPeer({ args: params.args, options });

  const { apiHost, tokens } = await getHostAndTokens();
  const networkgroupStream = new NetworkgroupStream({ apiHost, tokens, ownerId, ngId, peerId });
  networkgroupStream.prepareWireguardConfigurationSse();

  networkgroupStream
    .on('open', () => Logger.debug('SSE for networkgroup configuration (open) ' + JSON.stringify({ ownerId, ngId, peerId })))
    .on('conf', (conf) => {
      //Logger.println(formatLogLine(line));
      Logger.println(JSON.stringify(conf, null, 2));
    })
    .on('ping', () => Logger.debug('SSE for networkgroup configuration (ping)'))
    .on('close', ({ reason }) => Logger.debug('SSE for networkgroup configuration (close) ' + reason))
    .on('error', (error) => Logger.error(`SSE for networkgroup configuration (error): ${error}`));

  networkgroupStream.open({ autoRetry: true, maxRetryCount: 6 });

  Logger.println(`Successfully joined networkgroup '${ngId}'`);

  return networkgroupStream;

  //await networkgroup.sseWgConf({ ownerId, ngId, peerId }).then(sendToApi);
}

async function leaveNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  throw new Error('Not implemented yet.');
  // await networkgroup.sseWgConf({ ownerId, ngId, peerId }).then(sendToApi);
}

async function listMembers (params) {
  const { ng: ngIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Listing members from networkgroup '${ngId}'`);
  const result = await networkgroup.listMembers({ ownerId, ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println('No member found');
    }
    else {
      await printMembersTableHeader(naturalName);
      result.forEach(async (ng) => {
        Logger.println(await formatMembersLine(ng, naturalName));
      });
    }
  }
}

async function getMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, 'natural-name': naturalName, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Getting details for member '${memberId}' in networkgroup '${ngId}'`);
  const result = await networkgroup.getMember({ ownerId, ngId, memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    await printMembersTableHeader(naturalName);
    Logger.println(await formatMembersLine(result, naturalName));
  }
}

async function addMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, type, 'domain-name': domainName, label } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const body = { id: memberId, label, 'domain-name': domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkgroup.addMember({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`Successfully added member '${memberId}' to networkgroup '${ngId}'`);
}

async function removeMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  await networkgroup.removeMember({ ownerId, ngId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member '${memberId}' from networkgroup '${ngId}'`);
}

async function listPeers (params) {
  const { ng: ngIdOrLabel, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const result = await networkgroup.listPeers({ ownerId: ownerId, ngId: ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    printPeersTableHeader();
    result.forEach((peer) => {
      Logger.println(formatPeersLine(peer));
    });
  }
}

async function getPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const peer = await networkgroup.getPeer({ ownerId, ngId, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    printPeersTableHeader();
    Logger.println(formatPeersLine(peer));
  }
}

async function addExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId, role, 'public-key': publicKey, label, parent } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const body = { id: peerId, 'peer-role': role, 'public-key': publicKey, label, parent_member: parent };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkgroup.addExternalPeer({ ownerId, ngId, peerId }, body).then(sendToApi);

  Logger.println(`Adding external peer '${peerId}' to networkgroup '${ngId}'...`);
}

async function removeExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  await networkgroup.removeExternalPeer({ ownerId, ngId, peerId }).then(sendToApi);

  Logger.println(`Removing external peer '${peerId}' from networkgroup '${ngId}'...`);
}

module.exports = {
  listNetworkgroups,
  createNg,
  deleteNg,
  joinNg,
  leaveNg,
  listMembers,
  getMember,
  addMember,
  removeMember,
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
