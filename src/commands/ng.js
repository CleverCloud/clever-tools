import { printResults } from '../lib/ng-print.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as networkGroupResources from '../models/ng-resources.js';
import * as networkGroup from '../models/ng.js';

/** Create a Network Group
 * @param {Object} params
 * @param {Array<Object>} params.args
 * @param {Object} params.args[0] Network Group label
 * @param {string} params.options.description Network Group description
 * @param {Array<string>}  params.options.link Array of member IDs or labels to link to the Network Group
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.tags Comma-separated list of tags
 */
export async function createNg(params) {
  const [ngLabel] = params.args;
  const label = ngLabel.ngResourceLabel;
  const { description, link: membersIds, org, tags } = params.options;

  await networkGroup.create(label, description, tags, membersIds, org);

  const successMessage = `Network Group ${styleText('green', label)} successfully created`;
  if (membersIds == null) {
    Logger.printSuccess(`${successMessage}!`);
  } else {
    Logger.printSuccess(`${successMessage} with member(s):`);
    Logger.println(membersIds.map((id) => styleText('grey', `  - ${id}`)).join('\n'));
  }
}

/** Delete a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function deleteNg(params) {
  const [ngIdOrLabel] = params.args;
  const { org } = params.options;

  await networkGroup.destroy(ngIdOrLabel, org);
  const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
  Logger.printSuccess(`Network Group ${styleText('green', ngText)} successfully deleted!`);
}

/** Create an external peer in a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] External peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {string} params.args[2] WireGuard public key
 * @param {Object} params.options.org Organisation ID or name
 */
export async function createExternalPeer(params) {
  const [peerIdOrLabel, ngIdOrLabel, publicKey] = params.args;
  const { org } = params.options;

  await networkGroupResources.createExternalPeerWithParent(ngIdOrLabel, peerIdOrLabel.ngResourceLabel, publicKey, org);
  const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
  Logger.printSuccess(
    `External peer ${styleText('green', peerIdOrLabel.ngResourceLabel)} successfully created in Network Group ${styleText('green', ngText)}`,
  );
}

/** Delete an external peer from a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] External peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function deleteExternalPeer(params) {
  const [peerIdOrLabel, ngIdOrLabel] = params.args;
  const { org } = params.options;

  const peerText = peerIdOrLabel.ngResourceLabel ?? peerIdOrLabel.memberId;
  const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
  await networkGroupResources.deleteExternalPeerWithParent(ngIdOrLabel, peerText, org);
  Logger.printSuccess(
    `External peer ${styleText('green', peerText)} successfully deleted from Network Group ${styleText('green', ngText)}`,
  );
}

/** Link a member to a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member ID
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function linkToNg(params) {
  const [resourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await networkGroupResources.linkMember(ngIdOrLabel, resourceId.memberId, org);
  const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
  Logger.printSuccess(
    `Member ${styleText('green', resourceId.memberId)} successfully linked to Network Group ${styleText('green', ngText)}`,
  );
}

/** Unlink a member from a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member ID
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function unlinkFromNg(params) {
  const [resourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await networkGroupResources.unlinkMember(ngIdOrLabel, resourceId.memberId, org);
  const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
  Logger.printSuccess(
    `Member ${styleText('green', resourceId.memberId)} successfully unlinked from Network Group ${styleText('green', ngText)}`,
  );
}

/** Print the configuration of a Network Group's peer
 * @param {Object} params
 * @param {Object} params.args[0] Peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function getPeerConfig(params) {
  const [peerIdOrLabel, ngIdOrLabel] = params.args;
  const { org, format } = params.options;

  const config = await networkGroup.getPeerConfig(peerIdOrLabel, ngIdOrLabel, org);

  switch (format) {
    case 'json': {
      Logger.printJson(config);
      break;
    }
    case 'human':
    default: {
      const decodedConfiguration = Buffer.from(config.configuration, 'base64').toString('utf8');
      Logger.println(decodedConfiguration);
    }
  }
}

/** List Network Groups, their members and peers
 * @param {Object} params
 * @param {Object} params.options.orgaIdOrName Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function listNg(params) {
  const { org, format } = params.options;

  const ngs = await networkGroup.getAllNGs(org);

  switch (format) {
    case 'json': {
      Logger.printJson(ngs);
      break;
    }
    case 'human':
    default: {
      if (!ngs.length) {
        Logger.println(`ℹ️ No Network Group found, create one with ${styleText('blue', 'clever ng create')} command`);
        return;
      }
      const ngList = ngs.map(({ id, label, networkIp, members, peers }) => ({
        ID: id,
        Label: label,
        'Network CIDR': networkIp,
        Members: Object.keys(members).length,
        Peers: Object.keys(peers).length,
      }));

      console.table(ngList);
    }
  }
}

/** Show information about a Network Group, a member or a peer
 * @param {Object} params
 * @param {Object} params.args[0] ID or label of the Network Group, a member or a peer
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function get(params) {
  const [idOrLabel] = params.args;
  const { org, format } = params.options;
  const type = params.options.type ?? 'single';

  await printResults(idOrLabel, org, format, 'get', type);
}

/** Show information about a Network Group, a member or a peer
 * @param {Object} params
 * @param {Object} params.args[0] ID or label of the Network Group, a member or a peer
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function search(params) {
  const [idOrLabel] = params.args;
  const { org, format } = params.options;
  const type = params.options.type;

  await printResults(idOrLabel, org, format, 'search', type);
}
