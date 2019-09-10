'use strict';

const fs = require('fs');

const _ = require('lodash');
const Bacon = require('baconjs');
const git = require('isomorphic-git');
const { autocomplete } = require('cliparse');

const { loadOAuthConf } = require('./configuration.js');
const slugify = require('slugify');

const repo = { fs, dir: '.' };

async function addRemote (remoteName, url) {
  const safeRemoteName = slugify(remoteName);
  const allRemotes = await git.listRemotes({ ...repo });
  const existingRemote = _.find(allRemotes, { remote: safeRemoteName });
  if (existingRemote == null) {
    return git.addRemote({ ...repo, remote: safeRemoteName, url });
  }
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

async function getRemoteCommit (remoteUrl) {
  const tokens = await loadOAuthConf().toPromise();
  const remoteInfos = await git.getRemoteInfo({
    ...repo,
    username: tokens.token,
    password: tokens.secret,
    url: remoteUrl,
  });
  return _.get(remoteInfos, 'refs.heads.master');
}

function getFullBranch (branchName) {
  if (branchName === '') {
    return git.currentBranch({ ...repo, fullname: true });
  }
  return git.expandRef({ ...repo, ref: branchName });
};

function getBranchCommit (refspec) {
  return git.resolveRef({ ...repo, ref: refspec });
}

async function push (remoteUrl, branchRefspec, force) {
  const tokens = await loadOAuthConf().toPromise();
  try {
    const push = await git.push({
      ...repo,
      username: tokens.token,
      password: tokens.secret,
      url: remoteUrl,
      ref: branchRefspec,
      remoteRef: 'master',
      force,
    });
    if (push.errors != null) {
      throw new Error(push.errors.join(', '));
    }
    return push;
  }
  catch (e) {
    if (e.code === 'PushRejectedNonFastForward') {
      throw new Error('Push rejected because it was not a simple fast-forward. Use "--force" to override.');
    }
    throw e;
  }
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
