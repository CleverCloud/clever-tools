'use strict';

const { promises: fs, existsSync } = require('fs');
const isElevated = require('is-elevated');

const ngApi = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { NetworkgroupStream: NetworkGroupStream } = require('@clevercloud/client/cjs/streams/networkgroup.node.js');

const colors = require('colors/safe');

const Logger = require('../../logger.js');
const NetworkGroup = require('../../models/networkgroup.js');
const Formatter = require('../../models/format-string.js');
const Wg = require('../../models/wireguard.js');
const WgConf = require('../../models/wireguard-conf.js');
const { Deferred } = require('../../models/utils.js');

const { addExternalPeer, removeExternalPeer } = require('./peers.js');

const { sendToApi, getHostAndTokens } = require('../../models/send-to-api.js');

async function askForParentMember ({ ownerId, ngId }) {
  let members = await ngApi.listMembers({ ownerId, ngId }).then(sendToApi);
  members = members.filter((member) => member.type === 'externalNode');

  switch (members.length) {
    case 0:
      throw new Error([
        'You have to create an external node category (Network Group member) to join a Network Group.',
        `See ${Formatter.formatCommand('clever networkgroups members add')} to create a new external member (node).`,
      ].join('\n'));
    case 1:
      throw new Error(`This Network Group already has an external node category. Add ${Formatter.formatCommand(`--node-category-id ${Formatter.formatString(members[0].id)}`)} to select it.`);
    default:
      throw new Error(`This Network Group already has external node categories. Add ${Formatter.formatCommand('--node-category-id NODE_CATEGORY_ID')} to select one.`);
  }
}

function checkWgAvailable () {
  if (!Wg.checkAvailable()) {
    throw new Error([
      'Clever Cloud Network Groups use WireGuard®. Therefore, this command requires WireGuard® commands available on your computer.',
      '',
      `Follow instructions at ${Formatter.formatUrl('https://www.wireguard.com/install/')} to install it.`,
    ].join('\n'));
  }
}

async function joinNg (params) {
  checkWgAvailable();

  // Check if command was run with `sudo`
  if (!await isElevated()) {
    throw new Error(`This command uses ${Formatter.formatCommand('wg-quick')} under the hood. It needs privileges to create network interfaces. Please retry using ${Formatter.formatCommand('sudo')}.`);
  }

  const { ng: ngIdOrLabel, label } = params.options;
  let { 'node-category-id': parentId, 'private-key': privateKey, role, ip, port } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);

  if (role === 'server' && [ip, port].includes(null)) {
    throw new Error(`To join a Network Group as server, you need to specify an IP address and a port number. Please try again with ${Formatter.formatCommand('--ip IP_ADDRESS')} and ${Formatter.formatCommand('--port PORT_NUMBER')}.`);
  }

  const { confName, confPath } = WgConf.getWgConfInformation(ngId);
  if (existsSync(confPath)) {
    throw new Error(`You cannot join a Network Group twice at the same time with the same computer. Try using ${Formatter.formatCommand('clever networkgroups leave')} and running this command again.`);
  }

  if (!parentId) {
    parentId = await askForParentMember({ ownerId, ngId });
  }

  if (!privateKey) {
    privateKey = Wg.privateKey();
  }
  const publicKey = Wg.publicKey(privateKey);

  // Create new params keeping previous ones (e.g. verbose)
  const options = {
    ...params.options,
    ng: { ng_id: ngId },
    role,
    'public-key': publicKey,
    label,
    parent: parentId,
    ip,
    port,
  };
  const peerId = await addExternalPeer({ args: params.args, options });
  let interfaceName = confName;

  await WgConf.createWgConfFolderIfNeeded();

  try {
    await WgConf.storePeerId(peerId, confName);
  }
  catch (error) {
    // If Network Group already joined, remove freshly created external peer
    await removeExternalPeer({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
    throw error;
  }

  // Get initial configuration
  const initialConf = await ngApi.getWgConf({ ownerId, ngId, peerId }).then(sendToApi);
  initialConf.configuration = Buffer.from(initialConf.configuration, 'base64').toString();
  Logger.debug(`WireGuard® configuration received (version: ${initialConf.version})`);
  // Logger.debug(`[CONFIGURATION]\n${initialConf.configuration}\n[/CONFIGURATION]`);

  const initialConfFile = WgConf.confWithoutPlaceholders(initialConf.configuration, { privateKey });
  let confVersion;

  try {
    // Save initial conf
    // FIXME: Check if root as owner poses a problem
    await fs.writeFile(confPath, initialConfFile, { mode: 0o600, flag: 'wx' });
    Logger.info(`Saved WireGuard® configuration file to ${Formatter.formatUrl(confPath)}`);

    try {
      // Activate WireGuard® tunnel
      Wg.up(confPath);

      // Store initial configuration version
      confVersion = initialConf.version;

      Logger.println(colors.green(`Successfully joined Network Group ${Formatter.formatString(ngId)}`));

      // Read name of network interface created by WireGuard® (useful later)
      try {
        interfaceName = await WgConf.getInterfaceName(confName);
      }
      catch (error) {
        // Do not bubble up the error, just keep default configuration name
        Logger.debug(`A problem occured while reading WireGuard® interface name, fallback to configuration name (${Formatter.formatString(confName)})`);
      }
    }
    catch (error) {
      throw new Error(`Error activating WireGuard® tunnel: ${error}`);
    }
  }
  catch (error) {
    throw new Error(`Error saving WireGuard® configuration: ${error}`);
  }

  async function leave (ngId, peerId) {
    return leaveNg({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
  }

  const { apiHost, tokens } = await getHostAndTokens();
  const networkGroupStream = new NetworkGroupStream({ apiHost, tokens, ownerId, ngId, peerId });

  const deferred = new Deferred();

  // Automatically leave the Network Group when the user kills the program
  function leaveNgOnExit (signal) {
    // Add new line after ^C
    Logger.println('');
    Logger.debug(`Received ${signal}`);
    networkGroupStream.close();
    leave(ngId, peerId)
      .then(() => {
        // FIXME: ask kerupse if we need a special status code for user SIGTERM
        process.exit();
      })
      .catch((leaveError) => deferred.reject(leaveError));
  }

  process.on('SIGINT', leaveNgOnExit);
  process.on('SIGTERM', leaveNgOnExit);

  networkGroupStream
    .on('open', () => {
      const details = JSON.stringify({ ownerId, ngId, peerId });
      return Logger.debug(`SSE for Network Group configuration (${colors.green('open')}): ${details}`);
    })
    .on('conf', async (rawConf) => {
      // Check configuration version > actual
      if (rawConf.version <= confVersion) {
        Logger.info(`WireGuard® configuration version ${rawConf.version} received, skipping (actual: ${confVersion})`);
      }

      Logger.debug(`New WireGuard® configuration received (version: ${rawConf.version})`);
      // Logger.debug(`[CONFIGURATION]\n${rawConf.configuration}\n[/CONFIGURATION]`);

      const confFile = WgConf.confWithoutPlaceholders(rawConf.configuration, { privateKey });

      try {
        // Save conf
        // FIXME: Check if root as owner poses a problem
        await fs.writeFile(confPath, confFile, { mode: 0o600 });

        Logger.info(`Saved new WireGuard® configuration file to ${Formatter.formatUrl(confPath)}`);

        // Update WireGuard® configuration
        Wg.update(confPath, interfaceName);

        // Update actual configuration version
        confVersion = rawConf.version;
      }
      catch (error) {
        // Do not bubble up the error, it's not critical if we miss a configuration
        Logger.error(`Error saving new WireGuard® configuration: ${error}`);
      }
    })
    .on('ping', () => Logger.debug(`SSE for Network Group configuration (${colors.cyan('ping')})`))
    .on('close', (reason) => {
      Logger.debug(`SSE for Network Group configuration (${colors.red('close')}): ${JSON.stringify(reason)}`);
    })
    .on('error', (streamError) => {
      Logger.debug(`SSE for Network Group configuration (${colors.red('error')}): ${streamError}`);
      leave(ngId, peerId)
        .then(() => deferred.reject(new Error(`An error happened when listening to WireGuard® configuration changes: ${streamError}`)))
        .catch((leaveError) => deferred.reject(leaveError));
    });

  networkGroupStream.open({ autoRetry: true, maxRetryCount: 6 });

  return deferred.promise;
}

async function leaveNg (params) {
  const { ng: ngIdOrLabel } = params.options;
  let { 'peer-id': peerId } = params.options;
  const ownerId = await NetworkGroup.getOwnerId();
  const ngId = await NetworkGroup.getId(ownerId, ngIdOrLabel);
  const { confPath } = WgConf.getWgConfInformation(ngId);

  if (!peerId) {
    peerId = await WgConf.getPeerId(ngId);
    if (!peerId) {
      // Check if command was run with `sudo`, if not, maybe `peerId` was not found because the file was created by root
      if (!await isElevated()) {
        Logger.println(`Tip: You didn't run this command with ${Formatter.formatCommand('sudo')}, so we won't be able to leave a Network Group you joined using ${Formatter.formatCommand('sudo')}.`);
      }
      throw new Error(`We cannot find the ID you had in this Network Group. Try finding yourself in the results of ${Formatter.formatCommand('clever networkgroups peers list')} and running this command again adding the parameter ${Formatter.formatCommand('--peer-id PEER_ID')}.`);
    }
  }

  await removeExternalPeer({ options: { ng: { ng_id: ngId }, 'peer-id': peerId } });
  Wg.down(confPath);

  await WgConf.deletePeerIdFile(ngId);
  // We need `force: true` to avoid errors if file doesn't exist
  await fs.rm(confPath, { force: true });
  Logger.info(`Deleted WireGuard® configuration file for ${Formatter.formatString(ngId)}`);
}

module.exports = {
  joinNg,
  leaveNg,
};
