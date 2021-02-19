'use strict';

const { listNetworkgroups, createNg, deleteNg } = require('./index.js');
const { listMembers, getMember, addMember, removeMember } = require('./members.js');
const { listPeers, getPeer, addExternalPeer, removeExternalPeer } = require('./peers.js');
const { joinNg, leaveNg } = require('./join.js');

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
