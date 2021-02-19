'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const isElevated = require('is-elevated');

const client = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { NetworkgroupStream } = require('@clevercloud/client/cjs/streams/networkgroup.node.js');

const colors = require('colors/safe');
const { v4: uuidv4 } = require('uuid');
const prompts = require('prompts');

const Logger = require('../../logger.js');
const Networkgroup = require('../../models/networkgroup.js');
const Formatter = require('./format-string.js');
const WgConf = require('./wireguard-conf.js');
const { ngQuestions } = require('../../models/questions');

const { addMember } = require('./members.js');
const { addExternalPeer, removeExternalPeer } = require('./peers.js');

const { sendToApi, getHostAndTokens } = require('../../models/send-to-api.js');

async function askForParentMember ({ ownerId, ngId, interactive }) {
  let members = await client.listMembers({ ownerId, ngId }).then(sendToApi);
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
      const questions = [];
      questions.push(ngQuestions.ngNodeCategory(members));
      const result = await prompts(questions);

      // If user aborts
      if (!result.ngNodeCategory) {
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--node-category-id')} to select an external node category manually.`);
        return process.exit(1);
      }

      parentId = result.ngNodeCategory;
    }
    else {
      Logger.error(`This networkgroup already has an external node category. Add ${Formatter.formatCommand(`--node-category-id ${Formatter.formatString(members[0].id)}`)} to select it.`);
      return process.exit(1);
    }
  }

  if (parentId === 'new') {
    if (interactive) {
      const questions = [];
      questions.push(ngQuestions.ngMemberLabel);
      questions.push(ngQuestions.ngMemberDomainName);
      const result = await prompts(questions);

      const memberId = uuidv4();
      await addMember({
        options: {
          ng: { ng_id: ngId },
          'member-id': memberId,
          type: 'external',
          'domain-name': result.ngMemberDomainName,
          label: result.ngMemberLabel,
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

/**
 * Check that `wg` and `wg-quick` are installed
 */
function checkWgAvailable () {
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
}

async function joinNg (params) {
  checkWgAvailable();

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
      const questions = [];
      if (!ip) questions.push(ngQuestions.ngServerIp);
      if (!port) questions.push(ngQuestions.ngServerPort);
      const result = await prompts(questions);

      // If user aborts
      // Note: This is ugly, but for some reason, the `onCancel` method of `prompts` is called before a question even appears…
      if (!ip && !result.ngServerIp) {
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--ip IP_ADDRESS')} to specify an IP address manually.`);
        return process.exit(1);
      }
      if (!port && !result.ngServerPort) {
        Logger.error(`You cannot skip this question. Remove ${Formatter.formatCommand('--interactive')} and add ${Formatter.formatCommand('--port PORT_NUMBER')} to specify a port manually.`);
        return process.exit(1);
      }

      ip = ip ?? result.ngServerIp;
      port = port ?? result.ngServerPort;
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
  const confAsB64 = await client.getWgConf({ ownerId, ngId, peerId }).then(sendToApi);
  let conf = Buffer.from(confAsB64, 'base64').toString();
  Logger.debug('WireGuard® configuration received');
  Logger.debug(`[CONFIGURATION]\n${conf}\n[/CONFIGURATION]`);

  conf = WgConf.confWithoutPlaceholders(conf, { privateKey });

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

        conf = WgConf.confWithoutPlaceholders(conf, { privateKey });

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

module.exports = {
  joinNg,
  leaveNg,
};
