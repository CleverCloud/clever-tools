'use strict';

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { NetworkgroupStream } = require('@clevercloud/client/cjs/streams/networkgroup.node.js');

const formatTable = require('../format-table');
const colors = require('colors/safe');
const { v4: uuidv4 } = require('uuid');
const prompts = require('prompts');
const { ngQuestions } = require('../models/questions');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const Networkgroup = require('../models/networkgroup.js');

const { sendToApi, getHostAndTokens } = require('../models/send-to-api.js');

function printSeparator (columnLengths) {
  Logger.println('─'.repeat(columnLengths.reduce((a, b) => a + b + 2)));
}

// We use examples of maximum width text to have a clean display
const networkgroupsTableColumnLengths = [
  40, /* id length */
  20, /* label length */
  7, /* members length */
  5, /* peers length */
  40, /* description */
];
const formatNetworkgroupsTable = formatTable(networkgroupsTableColumnLengths);
function formatNetworkgroupsLine (ng) {
  return formatNetworkgroupsTable([
    [
      formatId(ng.id),
      formatString(ng.label, false),
      formatNumber(ng.members.length),
      formatNumber(ng.peers.length),
      formatString(ng.description || ' ', false),
    ],
  ]);
};
function printNetworkgroupsTableHeader () {
  Logger.println(colors.bold(formatNetworkgroupsTable([
    ['Networkgroup ID', 'Label', 'Members', 'Peers', 'Description'],
  ])));
  printSeparator(networkgroupsTableColumnLengths);
}

const membersTableColumnLengths = [
  40, /* id length */
  25, /* type length */
  40, /* label length */
  20, /* domain-name length */
];
const formatMembersTable = formatTable(membersTableColumnLengths);
async function formatMembersLine (member, showAliases = false) {
  return formatMembersTable([
    [
      showAliases ? formatString(await AppConfig.getMostNaturalName(member.id), false) : formatId(member.id),
      formatString(member.type, false),
      formatString(member.label, false),
      formatString(member['domain-name'] || ' ', false),
    ],
  ]);
};
async function printMembersTableHeader (naturalName = false) {
  Logger.println(colors.bold(formatMembersTable([
    [
      naturalName ? 'Member' : 'Member ID',
      'Member Type',
      'Label',
      'Domain Name',
    ],
  ])));
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
    [
      formatId(peer.id),
      formatString(peer.type, false),
      formatString(peer.endpoint.type, false),
      formatString(peer.label, false),
      formatString(peer.hostname, false),
      formatIp(ip),
    ],
  ]);
};
function printPeersTableHeader () {
  Logger.println(colors.bold(formatPeersTable([
    [
      'Peer ID',
      'Peer Type',
      'Endpoint Type',
      'Label',
      'Hostname',
      'IP Address',
    ],
  ])));
  printSeparator(peersTableColumnLengths);
}

function formatId (id) {
  return colors.dim(id);
}

function formatString (str, showingQuotes = true) {
  return colors.green(showingQuotes ? `'${str}'` : str);
}

function formatNumber (number) {
  return colors.yellow(number);
}

function formatIp (ip) {
  return colors.blue(ip);
}

async function getOwnerId () {
  return (await AppConfig.getAppDetails({})).ownerId;
}

async function listNetworkgroups (params) {
  const { json } = params.options;
  const ownerId = await getOwnerId();

  Logger.debug(`Listing networkgroups from owner ${formatString(ownerId)}`);
  const result = await networkgroup.get({ ownerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println('No networkgroup found. You can create one with `clever networkgroups create`.');
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

  Logger.debug(`Creating networkgroup from owner ${formatString(ownerId)}`);
  const body = { owner_id: ownerId, label, description, tags };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const result = await networkgroup.createNg({ ownerId }, body).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    Logger.println(`Networkgroup ${formatString(label)} was created with the id ${formatString(result.id)}.`);
  }
}

async function deleteNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Deleting networkgroup ${formatString(ngId)} from owner ${formatString(ownerId)}`);
  await networkgroup.deleteNg({ ownerId, ngId }).then(sendToApi);

  Logger.println(`Networkgroup ${formatString(ngId)} was successfully deleted.`);
}

async function joinNg (params) {
  // FIXME: Test if `wg-quick` is installed
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
  // FIXME: peerId is not used to create the external peer, so peerId doesn't exist

  const { apiHost, tokens } = await getHostAndTokens();
  const networkgroupStream = new NetworkgroupStream({ apiHost, tokens, ownerId, ngId, peerId });

  networkgroupStream
    .on('open', () => Logger.debug(`SSE for networkgroup configuration (${colors.green('open')}): ${JSON.stringify({ ownerId, ngId, peerId })}`))
    .on('conf', (conf) => {
      Logger.println(JSON.stringify(conf, null, 2));
      // FIXME: Apply new conf
    })
    .on('ping', () => Logger.debug('SSE for networkgroup configuration (ping)'))
    .on('close', (reason) => {
      Logger.debug(`SSE for networkgroup configuration (${colors.red('close')}): ${JSON.stringify(reason)}`);
      // FIXME: Leave NG
    })
    .on('error', (error) => {
      Logger.error(`SSE for networkgroup configuration (${colors.red('error')}): ${error}`);
      // FIXME: Leave NG
    });

  networkgroupStream.open({ autoRetry: true, maxRetryCount: 6 });

  Logger.println(`Successfully joined networkgroup ${formatString(ngId)}`);

  return networkgroupStream;
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
      Logger.println('No member found. You can add one with `clever networkgroups members add`.');
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

  Logger.debug(`Getting details for member ${formatString(memberId)} in networkgroup ${formatString(ngId)}`);
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

  Logger.println(`Successfully added member ${formatString(memberId)} to networkgroup ${formatString(ngId)}.`);
}

async function removeMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  await networkgroup.removeMember({ ownerId, ngId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${formatString(memberId)} from networkgroup ${formatString(ngId)}.`);
}

async function listPeers (params) {
  const { ng: ngIdOrLabel, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Listing peers from networkgroup ${formatString(ngId)}`);
  const result = await networkgroup.listPeers({ ownerId, ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println('No peer found. You can add an external one with `clever networkgroups peers add-external`.');
    }
    else {
      printPeersTableHeader();
      result.forEach((peer) => {
        Logger.println(formatPeersLine(peer));
      });
    }
  }
}

async function getPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.debug(`Getting details for peer ${formatString(peerId)} in networkgroup ${formatString(ngId)}`);
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
  Logger.debug(`Adding external peer ${peerId == null ? '(auto id)' : formatString(peerId)} to networkgroup ${formatString(ngId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkgroup.addExternalPeer({ ownerId, ngId, peerId }, body).then(sendToApi);

  Logger.println(`External peer ${peerId == null ? '(auto id)' : formatString(peerId)} must have been added to networkgroup ${formatString(ngId)}.`);
}

async function removeExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.println(`Removing external peer ${formatString(peerId)} from networkgroup ${formatString(ngId)}`);
  await networkgroup.removeExternalPeer({ ownerId, ngId, peerId }).then(sendToApi);

  Logger.println(`External peer ${formatString(peerId)} must have been removed from networkgroup ${formatString(ngId)}.`);
}

module.exports = {
  listNetworkgroups,
  createNg,
  deleteNg,
  joinNg,
  listMembers,
  getMember,
  addMember,
  removeMember,
  listPeers,
  getPeer,
  addExternalPeer,
  removeExternalPeer,
};
