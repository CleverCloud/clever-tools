'use strict';

const formatNgTable = require('../format-table.js');
const colors = require('colors/safe');

const AppConfig = require('./app_configuration.js');
const Logger = require('../logger.js');
const Formatter = require('./format-string.js');

function printSeparator (columnLengths) {
  Logger.println('─'.repeat(columnLengths.reduce((a, b) => a + b + 2)));
}

// We use examples of maximum width text to have a clean display
const networkGroupsTableColumnLengths = [
  39, /* id length */
  48, /* label length */
  7, /* members length */
  5, /* peers length */
  48, /* description */
];
const formatNetworkGroupsTable = formatNgTable(networkGroupsTableColumnLengths);
function formatNetworkGroupsLine (ng) {
  return formatNetworkGroupsTable([
    [
      Formatter.formatId(ng.id),
      Formatter.formatString(ng.label, false),
      Formatter.formatNumber(ng.members.length),
      Formatter.formatNumber(ng.peers.length),
      Formatter.formatString(ng.description || ' ', false),
    ],
  ]);
};
function printNetworkGroupsTableHeader () {
  Logger.println(colors.bold(formatNetworkGroupsTable([
    ['Network Group ID', 'Label', 'Members', 'Peers', 'Description'],
  ])));
  printSeparator(networkGroupsTableColumnLengths);
}

const membersTableColumnLengths = [
  48, /* id length */
  12, /* type length */
  48, /* label length */
  24, /* domain-name length */
];
const formatMembersTable = formatNgTable(membersTableColumnLengths);
async function formatMembersLine (member, showAliases = false) {
  return formatMembersTable([
    [
      showAliases
        ? Formatter.formatString(await AppConfig.getMostNaturalName(member.id), false)
        : Formatter.formatId(member.id),
      Formatter.formatString(member.type, false),
      Formatter.formatString(member.label, false),
      Formatter.formatString(member.domain_name || ' ', false),
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
  12, /* type length */
  14, /* endpoint type length */
  48, /* label length */
  24, /* hostname */
  15, /* ip */
];
const formatPeersTable = formatNgTable(peersTableColumnLengths);
function formatPeersLine (peer) {
  const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint.ng_term.ip : peer.endpoint.ng_ip;
  return formatPeersTable([
    [
      Formatter.formatId(peer.id),
      Formatter.formatString(peer.type, false),
      Formatter.formatString(peer.endpoint.type, false),
      Formatter.formatString(peer.label, false),
      Formatter.formatString(peer.hostname, false),
      Formatter.formatIp(ip),
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

module.exports = {
  formatNetworkGroupsLine,
  printNetworkGroupsTableHeader,
  formatMembersLine,
  printMembersTableHeader,
  formatPeersLine,
  printPeersTableHeader,
};
