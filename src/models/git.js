'use strict';

const fs = require('fs');

const _ = require('lodash');
const Bacon = require('baconjs');
const git = require('isomorphic-git');
const { autocomplete } = require('cliparse');

const { loadOAuthConf } = require('./configuration.js');
const slugify = require('slugify');

const repo = { fs, dir: '.' };

function addRemote (remoteName, url) {
  const safeRemoteName = slugify(remoteName);
  return Bacon.fromPromise(git.listRemotes({ ...repo }))
    .flatMapLatest((allRemotes) => {
      const existingRemote = _.find(allRemotes, { remote: safeRemoteName });
      if (existingRemote == null) {
        return Bacon.fromPromise(git.addRemote({ ...repo, remote: safeRemoteName, url }));
      }
    });
}

function resolveFullCommitId (commitId) {
  if (commitId == null) {
    return Bacon.constant(null);
  }
  return Bacon.fromPromise(git.expandOid({ ...repo, oid: commitId }))
    .flatMapError((e) => {
      if (e.code === 'ShortOidNotFound') {
        return new Bacon.Error(`Commit id ${commitId} is ambiguous`);
      }
      return e;
    });
}

function getRemoteCommit (remoteUrl) {
  return loadOAuthConf()
    .flatMapLatest((tokens) => {
      return Bacon.fromPromise(git.getRemoteInfo({
        ...repo,
        username: tokens.token,
        password: tokens.secret,
        url: remoteUrl,
      }));
    })
    .flatMapLatest((remoteInfos) => {
      return _.get(remoteInfos, 'refs.heads.master');
    });
}

function getFullBranch (branchName) {
  if (branchName === '') {
    return Bacon.fromPromise(git.currentBranch({ ...repo, fullname: true }));
  }
  return Bacon.fromPromise(git.expandRef({ ...repo, ref: branchName }));
};

function getBranchCommit (refspec) {
  return Bacon.fromPromise(git.resolveRef({ ...repo, ref: refspec }));
}

function push (remoteUrl, branchRefspec, force) {
  return loadOAuthConf()
    .flatMapLatest((tokens) => {
      return Bacon.fromPromise(git.push({
        ...repo,
        username: tokens.token,
        password: tokens.secret,
        url: remoteUrl,
        ref: branchRefspec,
        remoteRef: 'master',
        force,
      }));
    })
    .flatMapLatest((push) => {
      if (push.errors != null) {
        return new Bacon.Error(push.errors.join(', '));
      }
      return push;
    })
    .flatMapError((e) => {
      if (e.code === 'PushRejectedNonFastForward') {
        return new Bacon.Error('Push rejected because it was not a simple fast-forward. Use "--force" to override.');
      }
      return new Bacon.Error(e);
    });
}

function completeBranches () {
  return git.listBranches(repo)
    .then(autocomplete.words);
}

module.exports = {
  addRemote,
  resolveFullCommitId,
  getRemoteCommit,
  getFullBranch,
  getBranchCommit,
  push,
  completeBranches,
};
