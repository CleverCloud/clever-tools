import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import * as NG from '../models/ng.js';
import * as NGRessources from '../models/ng-ressources.js';

/** Create a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Network Group label
 * @param {string} params.options.org Organisation ID or name
 * @param {string} params.options.description Network Group description
 * @param {string} params.options.tags Comma-separated list of tags
 * @param {string} params.options.members-ids Comma-separated list of members IDs
 */
export async function createNg (params) {
  const [ngLabel] = params.args;
  const { org, description, 'members-ids': membersIds, tags } = params.options;

  await NG.create(org, ngLabel, description, tags, membersIds);

  const membersIdsMessage = membersIds ? ` with member(s):\n${colors.grey(` - ${membersIds.join('\n - ')}`)}` : '';
  Logger.println(`${colors.bold.green('✓')} Network Group ${colors.green(ngLabel)} successfully created${membersIdsMessage}!`);
}

/** Delete a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 */
export async function deleteNg (params) {
  const [ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NG.destroy(ngIdOrLabel, org);
  Logger.println(`${colors.bold.green('✓')} Network Group ${colors.green(ngIdOrLabel.ngLabel || ngIdOrLabel.ngId)} successfully deleted!`);
}

/** Create an external peer in a Network Group
 * @param {Object} params
 * @param {string} params.args[0] External peer ID or label
 * @param {string} params.args[1] Wireguard® public key
 * @param {string} params.args[2] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 */
export async function createExternalPeer (params) {
  const [idOrLabel, publicKey, ngIdOrLabel] = params.args;
  const { org } = params.options;

  if (!idOrLabel.ngRessourceLabel) {
    throw new Error('A valid external peer label is required');
  }

  if (!publicKey) {
    throw new Error('A Wireguard® public key is required');
  }
  await NGRessources.createExternalPeerWithParent(ngIdOrLabel, idOrLabel.ngRessourceLabel, publicKey, org);
  Logger.println(`${colors.bold.green('✓')} External peer ${colors.green(idOrLabel.ngRessourceLabel)} successfully created in Network Group ${colors.green(ngIdOrLabel.ngLabel || ngIdOrLabel.ngId)}`);
}

/** Delete an external peer from a Network Group
 * @param {Object} params
 * @param {string} params.args[0] External peer ID or label
 * @param {string} params.args[1] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 */
export async function deleteExternalPeer (params) {
  const [ressourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  await NGRessources.deleteExternalPeerWithParent(ngIdOrLabel, ressourceId.ngRessourceLabel || ressourceId.externalPeerId, org);
  Logger.println(`${colors.bold.green('✓')} External peer ${colors.green(ressourceId.ngRessourceLabel || ressourceId.externalPeerId)} successfully deleted from Network Group ${colors.green(ngIdOrLabel.ngLabel || ngIdOrLabel.ngId)}`);
}

/** Link a member or an external peer to a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member or external peer ID or label
 * @param {string} params.args[1] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 * @param {string} params.options['member-label'] Member label
 * @throws {Error} If the ressource ID is not a valid member or external peer ID
 */
export async function linkToNg (params) {
  const [ressourceId, ngIdOrLabel] = params.args;
  const { org, 'member-label': memberLabel } = params.options;

  if (!ressourceId.memberId && !ressourceId.externalPeerId) {
    throw new Error(`Ressource ID ${ressourceId} is not a valid member or external peer ID`);
  }

  await NGRessources.linkMember(ngIdOrLabel, ressourceId.memberId, org, memberLabel);
  Logger.println(`${colors.bold.green('✓')} Member ${colors.green(ressourceId.memberId)} successfully linked to Network Group ${colors.green(ngIdOrLabel.ngLabel || ngIdOrLabel.ngId)}`);
}

/** Unlink a member or an external peer from a Network Group
 * @param {Object} params
 * @param {string} params.args[0] Member or external peer ID or label
 * @param {string} params.args[1] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 * @throws {Error} If the ressource ID is not a valid member or external peer ID
 */
export async function unlinkFromNg (params) {
  const [ressourceId, ngIdOrLabel] = params.args;
  const { org } = params.options;

  if (!ressourceId.memberId) {
    throw new Error(`Ressource ID ${ressourceId} is not a valid member or external peer ID`);
  }

  await NGRessources.unlinkMember(ngIdOrLabel, ressourceId.memberId, org);
  Logger.println(`${colors.bold.green('✓')} Member ${colors.green(ressourceId.memberId)} successfully unlinked from Network Group ${colors.green(ngIdOrLabel.ngLabel || ngIdOrLabel.ngId)}`);
}

/** Print the configuration of a Network Group's peer
 * @param {Object} params
 * @param {string} params.args[0] Network Group ID or label
 * @param {string} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function printConfig (params) {
  const [peerIdOrLabel] = params.args;
  const { org, format } = params.options;

  const config = await NG.getConfig(peerIdOrLabel, org);

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
 * @param {string} params.options.orgaIdOrName Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function listNg (params) {
  const { org, format } = params.options;

  const ngs = await NG.getNGs(org);

  if (!ngs.length) {
    Logger.println(`${colors.blue('!')} No Network Group found, create one with ${colors.blue('clever ng create')} command`);
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
        members: Object.keys(members).length,
        peers: Object.keys(peers).length,
      }));

      console.table(ngList);
    }
  }
}

/** Print a Network Group, a member or a peer
 * @param {Object} params
 * @param {string} params.args[0] ID or label of the Network Group, a member or a peer
 * @param {string} params.options.org Organisation ID or name
 * @param {string} params.options.format Output format
 */
export async function printNgOrRessource (params) {
  const [IdOrLabel] = params.args;
  const { org, format } = params.options;

  const found = await NG.getNgOrRessource(IdOrLabel, org);

  switch (found.type) {
    case 'ng': {
      printNG(found.item, format);
      break;
    }
    case 'member': {
      printMember(found.item, format);
      break;
    }
    case 'peer': {
      printPeer(found.item, format);
      break;
    }
  }
}

/** Print a Network Group
 * @param {Object} ng
 * @param {string} format Output format
 * @private
 */
function printNG (ng, format) {

  switch (format) {
    case 'json': {
      Logger.printJson(ng);
      break;
    }
    case 'human':
    default: {
      const ngData = {
        id: ng.id,
        label: ng.label,
        description: ng.description,
        network: `${ng.networkIp}`,
        'members/peers': `${Object.keys(ng.members).length}/${Object.keys(ng.peers).length}`,
      };

      console.table(ngData);

      const members = Object.entries(ng.members)
        .sort((a, b) => a[1].domainName.localeCompare(b[1].domainName))
        .map(([id, member]) => ({
          'Domain name': member.domainName,
          Peers: member.peers.length,
        }));
      if (members.length) {
        Logger.println(`${colors.bold(' • Members:')}`);
        console.table(members);
      }

      const peers = Object.entries(ng.peers)
        .sort((a, b) => a[1].parentMember.localeCompare(b[1].parentMember))
        .map(([id, peer]) => peerToPrint(peer));
      if (peers.length) {
        Logger.println(`${colors.bold(' • Peers:')}`);
        console.table(peers);
      }
    }
  }
}

/** Print a Network Group member
 * @param {Object} member
 * @param {string} format Output format
 */
function printMember (member, format) {
  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(member, null, 2));
      break;
    }
    case 'human':
    default: {
      const itemsToPrint = [member]
        .map((item) => ({
          'Domain name': item.domainName,
          Peers: item.peers.length,
        }));
      console.table(itemsToPrint);

      const peers = member.peers
        .sort((a, b) => a.parentMember.localeCompare(b.parentMember))
        .map((peer) => peerToPrint(peer));
      if (peers.length) {
        Logger.println('Peers:');
        console.table(peers);
      }
    }
  }
}

/** Print a Network Group peer
 * @param {Object} peer
 * @param {string} format Output format
 * @param {boolean} full Print full peer details
 * @private
 */
function printPeer (peer, format, full = false) {
  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(peer, null, 2));
      break;
    }
    case 'human':
    default: {
      console.table(peerToPrint(peer, full));
    }
  }
}

/** Print a Network Group peer
 * @param {Object} peer
 * @param {boolean} full Print more peer details
 * @private
 */
function peerToPrint (peer, full = false) {
  let peerToPrint = {
    'Parent Member': peer.parentMember,
    ID: peer.id,
    Label: peer.label,
    Type: peer.type,
  };

  if (full) {
    peerToPrint = {
      ...peerToPrint,
      [peer.endpoint.ngTerm ? 'Host:IP' : 'Host']: peer.endpoint.ngTerm
        ? `${peer.endpoint.ngTerm.host}:${peer.endpoint.ngTerm.port}`
        : peer.endpoint.ngIp,
      ...(peer.endpoint.publicTerm && {
        'Public Term': `${peer.endpoint.publicTerm.host}:${peer.endpoint.publicTerm.port}`,
      }),
      'Public Key': peer.publicKey,
    };
  }
  return peerToPrint;
}
