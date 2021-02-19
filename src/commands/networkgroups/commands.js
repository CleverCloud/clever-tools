'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const isElevated = require('is-elevated');

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { NetworkgroupStream } = require('@clevercloud/client/cjs/streams/networkgroup.node.js');

const colors = require('colors/safe');
const { v4: uuidv4 } = require('uuid');
const prompts = require('prompts');

const Logger = require('../../logger.js');
const Networkgroup = require('../../models/networkgroup.js');
const Parsers = require('../../parsers.js');
const Formatter = require('./format-string.js');
const TableFormatter = require('./format-table.js');
const WgConf = require('./wireguard-conf.js');

const { listNetworkgroups, createNg, deleteNg } = require('./index.js');

const { sendToApi, getHostAndTokens } = require('../../models/send-to-api.js');

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
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--node-category-id')} to select an external node category manually.`);
        return process.exit(1);
      }

      parentId = result.memberId;
    }
    else {
      Logger.error(`This networkgroup already has an external node category. Add ${Formatter.formatCommand(`--node-category-id ${Formatter.formatString(members[0].id)}`)} to select it.`);
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
      Logger.error(`See ${Formatter.formatCommand('clever networkgroups members add')} or add ${Formatter.formatCommand('--interactive')} tag to create a new external member (node).`);
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
    Logger.error(`Clever Cloud's networkgroups use WireGuard®. Therefore, this command requires WireGuard® commands available on your computer.\n\nFollow instructions at ${Formatter.formatUrl('https://www.wireguard.com/install/')} to install it.`);
    return false;
  }

  // Check if command was run with `sudo`
  if (!await isElevated()) {
    Logger.error(`This command uses ${Formatter.formatCommand('wg-quick')} under the hood. It needs privileges to create network interfaces. Please retry using ${Formatter.formatCommand('sudo')}.`);
    return false;
  }

  // FIXME: Allow join as server
  const { ng: ngIdOrLabel, label, interactive } = params.options;
  let { 'node-category-id': parentId, 'private-key': privateKey, role, ip, port } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  if (role === 'server' && [ip, port].includes(null)) {
    if (interactive) {
      const result = await prompts([
        {
          type: ip ? null : 'text',
          name: 'ip',
          message: 'Your server peer IP address:',
          // FIXME: Add real validation
          validate: (value) => String(value).match(Parsers.ipAddressRegex),
        },
        {
          type: port ? null : 'number',
          name: 'port',
          message: 'Your server peer port:',
          // FIXME: Add real validation
          validate: (value) => String(value).match(Parsers.portNumberRegex),
        },
      ]);

      // If user aborts
      // Note: This is ugly, but for some reason, the `onCancel` method of `prompts` is called before a question even appears…
      if (!ip && !result.ip) {
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--ip IP_ADDRESS')} to specify an IP address manually.`);
        return process.exit(1);
      }
      if (!port && !result.port) {
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--port PORT_NUMBER')} to specify a port manually.`);
        return process.exit(1);
      }

      ip = ip ?? result.ip;
      port = port ?? result.port;
    }
    else {
      Logger.error(`To join a networkgroup as server, you need to specify an IP address and a port number. Please try again with ${Formatter.formatCommand('--ip IP_ADDRESS')} and ${Formatter.formatCommand('--port PORT_NUMBER')}.`);
      return false;
    }
  }

  const { confName, confPath } = WgConf.getConfInformation(ngId);
  if (fs.existsSync(confPath)) {
    Logger.error(`You cannot join a networkgroup twice at the same time with the same computer. Try using ${Formatter.formatCommand('clever networkgroups leave')} and running this command again.`);
    return false;
  }

  if (parentId === null) {
    parentId = await askForParentMember({ ownerId, ngId, interactive });
  }

  if (privateKey === null) {
    privateKey = execSync('wg genkey', { encoding: 'utf-8' }).trim();
  }
  const publicKey = execSync(`echo '${privateKey}' | wg pubkey`, { encoding: 'utf-8' }).trim();

  // Create new params keeping previous ones (e.g. verbose)
  const options = { ...params.options, ng: { ng_id: ngId }, role, 'public-key': publicKey, label, parent: parentId, ip, port };
  const peerId = await addExternalPeer({ args: params.args, options });
  let interfaceName = confName;

  try {
    WgConf.storePeerId(peerId, confName);
  }
  catch (error) {
    // If networkgroup already joined, remove freshly created external peer
    await removeExternalPeer({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
    throw error;
  }

  WgConf.createWgConfFolderIfNeeded();

  // Get current configuration
  const confAsB64 = await networkgroup.getWgConf({ ownerId, ngId, peerId }).then(sendToApi);
  let conf = Buffer.from(confAsB64, 'base64').toString();
  Logger.debug('WireGuard® configuration received');
  Logger.debug(`[CONFIGURATION]\n${conf}\n[/CONFIGURATION]`);

  conf = confWithoutPlaceholders(conf, { privateKey });

  // Save conf
  // FIXME: Check if root as owner poses a problem
  fs.writeFile(confPath, conf, { mode: 0o600, flag: 'wx' }, async (error) => {
    if (error) {
      Logger.error(`Error saving WireGuard® configuration: ${error}`);
      process.exit(1);
    }
    else {
      Logger.info(`Saved WireGuard® configuration file to ${Formatter.formatUrl(confPath)}`);
      try {
        // Activate WireGuard® tunnel
        // We must use `spawn` with `detached: true` instead of `exec`
        // because `wg-quick up` starts a `wireguard-go` used by `wg-quick down`
        const { stdout, stderr } = spawnSync('wg-quick', ['up', confPath], { detached: true, encoding: 'utf-8' });
        if (stdout.length > 0) Logger.debug(stdout.trim());
        if (stderr.length > 0) Logger.debug(stderr.trim());
        Logger.println('Activated WireGuard® tunnel');
        Logger.println(colors.green(`Successfully joined networkgroup ${Formatter.formatString(ngId)}`));

        const interfaceNameFile = `/var/run/wireguard/${confName}.name`;
        try {
          interfaceName = fs.readFileSync(interfaceNameFile, { encoding: 'utf-8' }).trim();
        }
        catch (error) {
          Logger.debug(`A problem occured while reading WireGuard® interface name in ${Formatter.formatUrl(interfaceNameFile)}, fallback to configuration name (${Formatter.formatString(confName)})`);
        }
      }
      catch (error) {
        Logger.error(`Error activating WireGuard® tunnel: ${error}`);
        process.exit(1);
      }
    }
  });

  async function leave (ngId, peerId) {
    return leaveNg({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
  }

  const { apiHost, tokens } = await getHostAndTokens();
  const networkgroupStream = new NetworkgroupStream({ apiHost, tokens, ownerId, ngId, peerId });

  // Automatically leave the networkgroup when the user kills the program
  async function leaveNgOnExit (signal) {
    // Add new line after ^C
    Logger.println('');
    Logger.debug(`Received ${signal}`);
    networkgroupStream.close();
    await leave(ngId, peerId);
    process.exit();
  }

  process.on('SIGINT', leaveNgOnExit);
  process.on('SIGTERM', leaveNgOnExit);

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
            Logger.info(`Saved new WireGuard® configuration file to ${Formatter.formatUrl(confPath)}`);
            try {
              // Update WireGuard® configuration
              execSync(`wg-quick strip ${confPath} | wg syncconf ${interfaceName} /dev/stdin`);
              Logger.info('Updated WireGuard® tunnel configuration');
            }
            catch (error) {
              Logger.error(`Error updating WireGuard® tunnel configuration: ${error}`);
              process.exit(1);
            }
          }
        });
      }
    })
    .on('ping', () => Logger.debug(`SSE for networkgroup configuration (${colors.cyan('ping')})`))
    .on('close', async (reason) => {
      Logger.debug(`SSE for networkgroup configuration (${colors.red('close')}): ${JSON.stringify(reason)}`);
    })
    .on('error', async (error) => {
      Logger.error(`SSE for networkgroup configuration (${colors.red('error')}): ${error}`);
      await leave(ngId, peerId);
    });

  networkgroupStream.open({ autoRetry: true, maxRetryCount: 6 });

  return networkgroupStream;
}

async function leaveNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  let { 'peer-id': peerId } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);
  const { confPath } = WgConf.getConfInformation(ngId);

  if (peerId === null) {
    peerId = WgConf.getPeerId(ngId);
    if (peerId === null) {
      Logger.error(`We cannot find the ID you had in this networkgroup. Try finding yourself in the results of ${Formatter.formatCommand('clever networkgroups peers list')} and running this command again adding the parameter ${Formatter.formatCommand('--peer-id PEER_ID')}.`);
      process.exit(1);
    }
  }

  await removeExternalPeer({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
  const { stdout, stderr } = spawnSync('wg-quick', ['down', confPath], { encoding: 'utf-8' });
  if (stdout.length > 0) Logger.debug(stdout.trim());
  if (stderr.length > 0) Logger.debug(stderr.trim());

  WgConf.deletePeerIdFile(ngId);
  // We need `force: true` to avoid errors if file doesn't exist
  fs.rmSync(confPath, { force: true });
  Logger.info(`Deleted WireGuard® configuration file for ${Formatter.formatString(ngId)}`);
}

async function listMembers (params) {
  const { ng: ngIdOrLabel, 'natural-name': naturalName, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Listing members from networkgroup '${ngId}'`);
  const result = await networkgroup.listMembers({ ownerId, ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No member found. You can add one with ${Formatter.formatCommand('clever networkgroups members add')}.`);
    }
    else {
      await TableFormatter.printMembersTableHeader(naturalName);
      result.forEach(async (ng) => {
        Logger.println(await TableFormatter.formatMembersLine(ng, naturalName));
      });
    }
  }
}

async function getMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, 'natural-name': naturalName, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Getting details for member ${Formatter.formatString(memberId)} in networkgroup ${Formatter.formatString(ngId)}`);
  const result = await networkgroup.getMember({ ownerId, ngId, memberId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    await TableFormatter.printMembersTableHeader(naturalName);
    Logger.println(await TableFormatter.formatMembersLine(result, naturalName));
  }
}

async function addMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId, type, 'domain-name': domainName, label } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const body = { id: memberId, label, 'domain-name': domainName, type };
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  await networkgroup.addMember({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`Successfully added member ${Formatter.formatString(memberId)} to networkgroup ${Formatter.formatString(ngId)}.`);
}

async function removeMember (params) {
  const { ng: ngIdOrLabel, 'member-id': memberId } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  await networkgroup.removeMember({ ownerId, ngId, memberId }).then(sendToApi);

  Logger.println(`Successfully removed member ${Formatter.formatString(memberId)} from networkgroup ${Formatter.formatString(ngId)}.`);
}

async function listPeers (params) {
  const { ng: ngIdOrLabel, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Listing peers from networkgroup ${Formatter.formatString(ngId)}`);
  const result = await networkgroup.listPeers({ ownerId, ngId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(result, null, 2));
  }
  else {
    if (result.length === 0) {
      Logger.println(`No peer found. You can add an external one with ${Formatter.formatCommand('clever networkgroups peers add-external')}.`);
    }
    else {
      TableFormatter.printPeersTableHeader();
      result.forEach((peer) => {
        Logger.println(TableFormatter.formatPeersLine(peer));
      });
    }
  }
}

async function getPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId, json } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Getting details for peer ${Formatter.formatString(peerId)} in networkgroup ${Formatter.formatString(ngId)}`);
  const peer = await networkgroup.getPeer({ ownerId, ngId, peerId }).then(sendToApi);

  if (json) {
    Logger.println(JSON.stringify(peer, null, 2));
  }
  else {
    TableFormatter.printPeersTableHeader();
    Logger.println(TableFormatter.formatPeersLine(peer));
  }
}

async function addExternalPeer (params) {
  const { ng: ngIdOrLabel, role, 'public-key': publicKey, label, parent, ip, port } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  const body = { 'peer-role': role, 'public-key': publicKey, label, parent_member: parent, ip, port };
  Logger.info(`Adding external peer to networkgroup ${Formatter.formatString(ngId)}`);
  Logger.debug('Sending body: ' + JSON.stringify(body, null, 2));
  const { id: peerId } = await networkgroup.addExternalPeer({ ownerId, ngId }, body).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been added to networkgroup ${Formatter.formatString(ngId)}.`);
  return peerId;
}

async function removeExternalPeer (params) {
  const { ng: ngIdOrLabel, 'peer-id': peerId } = params.options;
  const ownerId = await Networkgroup.getOwnerId();
  const ngId = await Networkgroup.getId(ownerId, ngIdOrLabel);

  Logger.info(`Removing external peer ${Formatter.formatString(peerId)} from networkgroup ${Formatter.formatString(ngId)}`);
  // FIXME: Currently, when an external peer is already deleted, the API returns 404.
  //        This is detected as an error status code and throws an error.
  //        This prevents `clever ng leave` from working correctly in some cases.
  //        This status code will be changed to 204 soon.
  await networkgroup.removeExternalPeer({ ownerId, ngId, peerId }).then(sendToApi);

  Logger.println(`External peer ${Formatter.formatString(peerId)} must have been removed from networkgroup ${Formatter.formatString(ngId)}.`);
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
