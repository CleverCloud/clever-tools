import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import * as NG from '../models/ng.js';

/** Print a Network Group
 * @param {Object} ng The Network Group to print
 * @param {string} format Output format
 * @param {boolean} full If true, get more details about the Network Group (default: false)
 */
function printNg (ng, format, full = false) {

  switch (format) {
    case 'json': {
      Logger.printJson(ng);
      break;
    }
    case 'human':
    default: {
      const ngData = {
        ID: ng.id,
        Label: ng.label,
        Description: ng.description,
        Network: `${ng.networkIp}`,
        'Members/Peers': `${Object.keys(ng.members)?.length}/${Object.keys(ng.peers)?.length}`,
      };

      console.table(ngData);

      if (full) {
        const members = Object.entries(ng.members)
          .sort((a, b) => a[1].domainName.localeCompare(b[1].domainName))
          .map(([id, member]) => ({
            Domain: member.domainName,
          }));
        if (members.length) {
          Logger.println(`${colors.bold(' • Members:')}`);
          console.table(members);
        }

        const peers = Object.entries(ng.peers)
          .sort((a, b) => a[1].parentMember.localeCompare(b[1].parentMember))
          .map(([id, peer]) => formatPeer(peer));
        if (peers.length) {
          Logger.println(`${colors.bold(' • Peers:')}`);
          console.table(peers);
        }
      }
    }
  }
}

/** Print a Network Group member
 * @param {Object} member The Network Group member to print
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
      console.table({
        Label: member.label,
        Domain: member.domainName,
      });
    }
  }
}

/** Print a Network Group peer
 * @param {Object} peer The Network Group peer to print
 * @param {string} format Output format
 * @param {boolean} full If true, get more details about the peer (default: false)
 */
function printPeer (peer, format, full = false) {
  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(peer, null, 2));
      break;
    }
    case 'human':
    default: {
      console.table(formatPeer(peer, full));
    }
  }
}

/** Format a peer to print
 * @param {Object} peer
 * @param {boolean} full If true, get more details about the peer (default: false)
 */
function formatPeer (peer, full = false) {
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

/** Print the results of a search or get action
 * @param {object} idOrLabel ID or label of the Network Group, a member or a peer
 * @param {object} org Organisation ID or name
 * @param {string} format Output format
 * @param {string} action Action to perform (search or get)
 * @param {string} type Type of item to search (NetworkGroup, Member, Peer)
 */
export async function printResults (idOrLabel, org, format, action, type) {

  const exactMatch = action === 'get';
  type = type ?? (action === 'search' ? 'all' : 'single');

  const found = await NG.searchNgOrResource(idOrLabel, org, type, exactMatch);

  if (!found.length) {
    const searchString = idOrLabel.ngId
      || idOrLabel.memberId
      || idOrLabel.ngResourceLabel;
    Logger.println(`${colors.blue('!')} No Network Group or resource found for ${colors.blue(searchString)}`);
    return;
  }

  if (found.length === 1) {
    switch (found[0].type) {
      case 'NetworkGroup':
        return printNg(found[0], format, true);
      case 'Member':
        return printMember(found[0], format);
      case 'CleverPeer':
      case 'ExternalPeer':
        return printPeer(found[0], format, true);
      default:
        throw new Error(`Unknown item type: ${found[0].type}`);
    }
  }

  if (action === 'search') {
    // Group found items by type in a new object
    const grouped = found.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});

    switch (format) {
      case 'json': {
        Logger.printJson(grouped);
        break;
      }
      case 'human':
      default: {
        if (grouped.NetworkGroup) {
          Logger.println(`${colors.bold(` • Found ${grouped.NetworkGroup.length} Network Group(s):`)}`);
          grouped.NetworkGroup?.forEach((item) => printNg(item, format));
        }

        if (grouped.Member) {
          Logger.println(`${colors.bold(` • Found ${grouped.Member.length} Member(s):`)}`);
          grouped.Member?.forEach((item) => printMember(item, format));
        }

        if (grouped.ExternalPeer || grouped.CleverPeer) {
          Logger.println(`${colors.bold(` • Found ${grouped.ExternalPeer.length + grouped.CleverPeer.length} Peer(s):`)}`);
          grouped.CleverPeer?.forEach((item) => printPeer(item, format));
          grouped.ExternalPeer?.forEach((item) => printPeer(item, format));
        }
      }
    }
  }
}
