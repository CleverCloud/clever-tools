'use strict';

const formatTable = require('../../format-table');
const colors = require('colors/safe');

const AppConfig = require('../../models/app_configuration.js');
const Logger = require('../../logger.js');
const Formatter = require('./format-string.js');

function printSeparator (columnLengths) {
  Logger.println('─'.repeat(columnLengths.reduce((a, b) => a + b + 2)));
}

// We use examples of maximum width text to have a clean display
const networkgroupsTableColumnLengths = [
  39, /* id length */
  48, /* label length */
  7, /* members length */
  5, /* peers length */
  48, /* description */
];
const formatNetworkgroupsTable = formatTable(networkgroupsTableColumnLengths);
function formatNetworkgroupsLine (ng) {
  return formatNetworkgroupsTable([
    [
      Formatter.formatId(ng.id),
      Formatter.formatString(ng.label, false),
      Formatter.formatNumber(ng.members.length),
      Formatter.formatNumber(ng.peers.length),
      Formatter.formatString(ng.description || ' ', false),
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
  48, /* id length */
  12, /* type length */
  48, /* label length */
  24, /* domain-name length */
];
const formatMembersTable = formatTable(membersTableColumnLengths);
async function formatMembersLine (member, showAliases = false) {
  return formatMembersTable([
    [
      showAliases
        ? Formatter.formatString(await AppConfig.getMostNaturalName(member.id), false)
        : Formatter.formatId(member.id),
      Formatter.formatString(member.type, false),
      Formatter.formatString(member.label, false),
      Formatter.formatString(member['domain-name'] || ' ', false),
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
const formatPeersTable = formatTable(peersTableColumnLengths);
function formatPeersLine (peer) {
  const ip = (peer.endpoint.type === 'ServerEndpoint') ? peer.endpoint['ng-term'].ip : peer.endpoint['ng-ip'];
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
  formatNetworkgroupsLine,
  printNetworkgroupsTableHeader,
  formatMembersLine,
  printMembersTableHeader,
  formatPeersLine,
  printPeersTableHeader,
};
