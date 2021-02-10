'use strict';

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const isElevated = require('is-elevated');

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
      formatString(ng.label, true, false),
      formatNumber(ng.members.length),
      formatNumber(ng.peers.length),
      formatString(ng.description || ' ', true, false),
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
      showAliases ? formatString(await AppConfig.getMostNaturalName(member.id), true, false) : formatId(member.id),
      formatString(member.type, true, false),
      formatString(member.label, true, false),
      formatString(member['domain-name'] || ' ', true, false),
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
      formatString(peer.type, true, false),
      formatString(peer.endpoint.type, true, false),
      formatString(peer.label, true, false),
      formatString(peer.hostname, true, false),
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

function formatId (id, colored = true) {
  return colored ? colors.dim(id) : id;
}

function formatString (str, colored = true, decorated = true) {
  const string = decorated ? `'${str}'` : str;
  return colored ? colors.green(string) : string;
}

function formatNumber (number, colored = true) {
  return colored ? colors.yellow(number) : number;
}

function formatIp (ip, colored = true) {
  return colored ? colors.blue(ip) : ip;
}

function formatUrl (url, colored = true, decorated = true) {
  const string = decorated ? `<${url}>` : url;
  return colored ? colors.blue(string) : string;
}

function formatCommand (command, colored = true, decorated = true) {
  const string = decorated ? `\`${command}\`` : command;
  return colored ? colors.magenta(string) : string;
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
      Logger.println(`No networkgroup found. You can create one with ${formatCommand('clever networkgroups create')}.`);
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

function getWgConfFolder () {
  // TODO: See if we can use runtime dirs
  return path.join(os.tmpdir(), 'com.clever-cloud.networkgroups');
}

function createWgConfFolderIfNeeded () {
  const confFolder = getWgConfFolder();
  if (!fs.existsSync(confFolder)) {
    fs.mkdirSync(confFolder);
  }
}

function getConfInformation (ngId) {
  const confName = `wgcc${ngId.slice(-8)}`;
  const confPath = path.join(getWgConfFolder(), `${confName}.conf`);

  return { confName, confPath };
}

async function askForParentMember ({ ownerId, ngId, interactive }) {
  let members = await networkgroup.listMembers({ ownerId, ngId }).then(sendToApi);
  members = members.filter((member) => {
    return member.type === 'externalNode';
  });

  let parentId = null;
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

      // If user aborts
      if (result.memberId === undefined) {
        Logger.error(`You cannot skip this question. Remove ${formatCommand('--interactive')} and add ${formatCommand('--node-category-id')} to select an external node category manually.`);
        return process.exit(1);
      }

      parentId = result.memberId;
    }
    else {
      Logger.error(`This networkgroup already has an external node category. Add ${formatCommand(`--node-category-id ${formatString(members[0].id)}`)} to select it.`);
      return process.exit(1);
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
      Logger.error(`See ${formatCommand('clever networkgroups members add')} or add ${formatCommand('--interactive')} tag to create a new external member (node).`);
      return process.exit(1);
    }
  }

  return parentId;
}

function confWithoutPlaceholders (conf, { privateKey }) {
  conf = conf.replace('<%PrivateKey%>', privateKey);

  // TODO: This just removes leading and trailing new lines in the configuration file
  //       It should be better formatted on the API's side
  conf = conf.trim();

  return conf;
}

async function joinNg (params) {
  // Check that `wg` and `wg-quick` are installed
  try {
    // The redirect to `/dev/null` ensures that your program does not produce the output of these commands.
    execSync('which wg > /dev/null 2>&1');
    execSync('which wg-quick > /dev/null 2>&1');

    // FIXME: Handle Windows
    //        - Those checks won't work on Windows, and wg-quick doesn't exist anyway.
    //          - We need to wait for a Windows version of wg-quick to support the rest of the operations
    //          - Or we could use vanilla wg on Windows, and wg-quick on other OSs
  }
  catch (error) {
    Logger.error(`Clever Cloud's networkgroups use WireGuard®. Therefore, this command requires WireGuard® commands available on your computer.\n\nFollow instructions at ${formatUrl('https://www.wireguard.com/install/')} to install it.`);
    return false;
  }

  // Check if command was run with `sudo`
  if (!await isElevated()) {
    Logger.error(`This command uses ${formatCommand('wg-quick')} under the hood. It needs privileges to create network interfaces. Please retry using ${formatCommand('sudo')}.`);
    return false;
  }

  // FIXME: Allow join as server
  // FIXME: Remove peerId
  const { ng: ngIdOrLabel, label, interactive, 'peer-id': peerId } = params.options;
  let { 'node-category-id': parentId, 'private-key': privateKey } = params.options;
  const ownerId = await getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  if (parentId === null) {
    parentId = await askForParentMember({ ownerId, ngId, interactive });
  }

  if (privateKey === null) {
    privateKey = execSync('wg genkey', { encoding: 'utf-8' }).trim();
  }
  const publicKey = execSync(`echo '${privateKey}' | wg pubkey`, { encoding: 'utf-8' }).trim();

  // Create new params keeping previous ones (e.g. verbose)
  const options = { ...params.options, ng: { ng_id: ngId }, 'peer-id': peerId, role: 'client', 'public-key': publicKey, label, parent: parentId };
  await addExternalPeer({ args: params.args, options });
  // FIXME: peerId is not used to create the external peer, so peerId doesn't exist

  const { confName, confPath } = getConfInformation(ngId);
  let interfaceName = confName;

  createWgConfFolderIfNeeded();

  // Get current configuration
  const confAsB64 = await networkgroup.getWgConf({ ownerId, ngId, peerId }).then(sendToApi);
  let conf = Buffer.from(confAsB64, 'base64').toString();
  Logger.debug('WireGuard® configuration received');
  Logger.debug(`[CONFIGURATION]\n${conf}\n[/CONFIGURATION]`);

  conf = confWithoutPlaceholders(conf, { privateKey });

  // Save conf
  // FIXME: Check if root as owner poses a problem
  fs.writeFile(confPath, conf, { mode: 0o600 }, (error) => {
    if (error) {
      Logger.error(`Error saving WireGuard® configuration: ${error}`);
      process.exit(1);
    }
    else {
      Logger.debug(`Saved WireGuard® configuration file to ${formatUrl(confPath)}`);
      try {
        // Activate WireGuard® tunnel
        execSync(`wg-quick up ${confPath}`);
        Logger.println('Activated WireGuard® tunnel');
        Logger.println(colors.green(`Successfully joined networkgroup ${formatString(ngId)}`));

        const interfaceNameFile = `/var/run/wireguard/${confName}.name`;
        try {
          interfaceName = fs.readFileSync(interfaceNameFile, { encoding: 'utf-8' }).trim();
        }
        catch (error) {
          Logger.debug(`A problem occured while reading WireGuard® interface name in ${formatUrl(interfaceNameFile)}, fallback to configuration name (${formatString(confName)})`);
        }
      }
      catch (error) {
        Logger.error(`Error activating WireGuard® tunnel: ${error}`);
        process.exit(1);
      }
    }
  });

  // Automatically leave the networkgroup when the user kills the program
  async function leaveNgOnExit (signal) {
    // Add new line after ^C
    Logger.println('');
    Logger.debug(`Received ${signal}`);
    await leaveNg(ngId, peerId);
    process.exit();
  }

  process.on('SIGINT', leaveNgOnExit);
  process.on('SIGTERM', leaveNgOnExit);

  const { apiHost, tokens } = await getHostAndTokens();
  const networkgroupStream = new NetworkgroupStream({ apiHost, tokens, ownerId, ngId, peerId });

  networkgroupStream
    .on('open', () => Logger.debug(`SSE for networkgroup configuration (${colors.green('open')}): ${JSON.stringify({ ownerId, ngId, peerId })}`))
    .on('conf', (conf) => {
      if (conf !== null && conf.length !== 0) {
        Logger.debug('New WireGuard® configuration received');
        Logger.debug(`[CONFIGURATION]\n${conf}\n[/CONFIGURATION]`);

        // FIXME: Check configuration version > actual

        conf = confWithoutPlaceholders(conf, { privateKey });

        // Save conf
        // FIXME: Check if root as owner poses a problem
        fs.writeFile(confPath, conf, { mode: 0o600 }, (error) => {
          if (error) {
            Logger.error(`Error saving new WireGuard® configuration: ${error}`);
          }
          else {
            Logger.debug(`Saved new WireGuard® configuration file to ${formatUrl(confPath)}`);
            try {
              // Update WireGuard® configuration
              execSync(`wg-quick strip ${confPath} | wg syncconf ${interfaceName} /dev/stdin`);
              Logger.println('Updated WireGuard® tunnel configuration');
            }
            catch (error) {
              Logger.error(`Error updating WireGuard® tunnel configuration: ${error}`);
              process.exit(1);
            }
          }
        });
      }
    })
    .on('ping', () => Logger.debug(`SSE for networkgroup configuration (${colors.blue('ping')})`))
    .on('close', async (reason) => {
      Logger.debug(`SSE for networkgroup configuration (${colors.red('close')}): ${JSON.stringify(reason)}`);
      await leaveNg(ngId, peerId);
    })
    .on('error', async (error) => {
      Logger.error(`SSE for networkgroup configuration (${colors.red('error')}): ${error}`);
      await leaveNg(ngId, peerId);
    });

  networkgroupStream.open({ autoRetry: true, maxRetryCount: 6 });

  return networkgroupStream;
}

async function leaveNg (ngId, peerId) {
  await removeExternalPeer({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
  // FIXME: `wg-quick down`
  // FIXME: Remove WG conf file
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
