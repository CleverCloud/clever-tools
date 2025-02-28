import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import * as NG from '../models/ng.js';
import { printResults } from './ng-print.js';
import * as NGResources from '../models/ng-resources.js';

/** Create a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Network Group label
 * @param {string} params.options.description Network Group description
 * @param {Array<string>}  params.options.link Array of member IDs or labels to link to the Network Group
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.tags Comma-separated list of tags
 */
export async function createNg (params) {
  const label = params.args[0].ngResourceLabel;
  const { description, link: membersIds, org, tags } = params.options;

  await NG.create(label, description, tags, membersIds, org);

  const membersIdsMessage = membersIds ? ` with member(s):\n${colors.grey(` - ${membersIds.join('\n - ')}`)}` : '';
  Logger.println(`${colors.bold.green('✓')} Network Group ${colors.green(label)} successfully created${membersIdsMessage}!`);
}

/** Delete a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function deleteNg (params) {
  const [ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NG.destroy(ngIdOrLabel, org);
  Logger.println(`${colors.bold.green('✓')} Network Group ${colors.green(ngIdOrLabel.ngResourceLabel || ngIdOrLabel.ngId)} successfully deleted!`);
}

/** Create an external peer in a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] External peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {string} params.args[2] Wireguard public key
 * @param {Object} params.options.org Organisation ID or name
 */
export async function createExternalPeer (params) {
  const [idOrLabel, ngIdOrLabel, publicKey] = params.args;
  const { org } = params.options;

  await NGResources.createExternalPeerWithParent(ngIdOrLabel, idOrLabel.ngResourceLabel, publicKey, org);
  Logger.println(`${colors.bold.green('✓')} External peer ${colors.green(idOrLabel.ngResourceLabel)} successfully created in Network Group ${colors.green(ngIdOrLabel.ngResourceLabel || ngIdOrLabel.ngId)}`);
}

/** Delete an external peer from a Network Group
 * @param {Object} params
 * @param {Object} params.args[0] External peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function deleteExternalPeer (params) {
  const [idOrLabel, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NGResources.deleteExternalPeerWithParent(ngIdOrLabel, idOrLabel.ngResourceLabel || idOrLabel.memberId, org);
  Logger.println(`${colors.bold.green('✓')} External peer ${colors.green(idOrLabel.ngResourceLabel || idOrLabel.memberId)} successfully deleted from Network Group ${colors.green(ngIdOrLabel.ngResourceLabel || ngIdOrLabel.ngId)}`);
}

/** Link a member to a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member ID
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function linkToNg (params) {
  const [resourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NGResources.linkMember(ngIdOrLabel, resourceId.memberId, org);
  Logger.println(`${colors.bold.green('✓')} Member ${colors.green(resourceId.memberId)} successfully linked to Network Group ${colors.green(ngIdOrLabel.ngResourceLabel || ngIdOrLabel.ngId)}`);
}

/** Unlink a member from a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member ID
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 */
export async function unlinkFromNg (params) {
  const [resourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NGResources.unlinkMember(ngIdOrLabel, resourceId.memberId, org);
  Logger.println(`${colors.bold.green('✓')} Member ${colors.green(resourceId.memberId)} successfully unlinked from Network Group ${colors.green(ngIdOrLabel.ngResourceLabel || ngIdOrLabel.ngId)}`);
}

/** Print the configuration of a Network Group's peer
 * @param {Object} params
 * @param {Object} params.args[0] Peer ID or label
 * @param {Object} params.args[1] Network Group ID or label
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function getPeerConfig (params) {
  const [peerIdOrLabel, ngIdOrLabel] = params.args;
  const { org, format } = params.options;

  const config = await NG.getPeerConfig(peerIdOrLabel, ngIdOrLabel, org);

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
export async function listNg (params) {
  const { org, format } = params.options;

  const ngs = await NG.getAllNGs(org);

  if (!ngs.length) {
    Logger.println(`ℹ️ No Network Group found, create one with ${colors.blue('clever ng create')} command`);
    return;
  }

  switch (format) {
    case 'json': {
      Logger.printJson(ngs);
      break;
    }
    case 'human':
    default: {
      const ngList = ngs.map(({
        id,
        label,
        networkIp,
        members,
        peers,
      }) => ({
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
export async function get (params) {
  const [idOrLabel] = params.args;
  const { org, format } = params.options;
  const type = params.options.type ?? 'single';

  printResults(idOrLabel, org, format, 'get', type);
}

/** Show information about a Network Group, a member or a peer
 * @param {Object} params
 * @param {Object} params.args[0] ID or label of the Network Group, a member or a peer
 * @param {Object} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function search (params) {
  const [idOrLabel] = params.args;
  const { org, format } = params.options;
  const type = params.options.type;

  printResults(idOrLabel, org, format, 'search', type);
}
