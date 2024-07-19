'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const git = require('isomorphic-git');
const http = require('./isomorphic-http-with-agent.js');
const cliparse = require('cliparse');
const slugify = require('slugify');
const { findPath } = require('./fs-utils.js');
const { loadOAuthConf } = require('./configuration.js');

async function getRepo () {
  try {
    const dir = await findPath('.', '.git');
    return { fs, dir, http };
  }
  catch (e) {
    throw new Error('Could not find the .git folder.');
  }
}

async function onAuth () {
  const tokens = await loadOAuthConf();
  return {
    username: tokens.token,
    password: tokens.secret,
  };
}

async function addRemote (remoteName, url) {
  const repo = await getRepo();
  const safeRemoteName = slugify(remoteName);
  const allRemotes = await git.listRemotes({ ...repo });
  const existingRemote = _.find(allRemotes, { remote: safeRemoteName });
  if (existingRemote == null) {
    // In some situations, we may end up with race conditions so we force it
    return git.addRemote({ ...repo, remote: safeRemoteName, url, force: true });
  }
}

async function resolveFullCommitId (commitId) {
  if (commitId == null) {
    return null;
  }
  try {
    const repo = await getRepo();
    return await git.expandOid({ ...repo, oid: commitId });
  }
  catch (e) {
    if (e.code === 'ShortOidNotFound') {
      throw new Error(`Commit id ${commitId} is ambiguous`);
    }
    throw e;
  }
}

async function getRemoteCommit (remoteUrl) {
  const repo = await getRepo();
  const remoteInfos = await git.getRemoteInfo({
    ...repo,
    onAuth,
    url: remoteUrl,
  });
  return _.get(remoteInfos, 'refs.heads.master');
}

async function getFullBranch (branchName) {
  const repo = await getRepo();
  if (branchName === '') {
    const currentBranch = await git.currentBranch({ ...repo, fullname: true });
    return currentBranch || 'HEAD';
  }
  return git.expandRef({ ...repo, ref: branchName });
};

async function getBranchCommit (refspec) {
  const repo = await getRepo();
  const oid = await git.resolveRef({ ...repo, ref: refspec });
  // When a refspec refers to an annotated tag, the OID ref represents the annotation and not the commit directly,
  // that's why we need a call to `readCommit`.
  const res = await git.readCommit({ ...repo, ref: refspec, oid });
  return res.oid;
}

async function isExistingTag (tag) {
  const repo = await getRepo();
  const tags = await git.listTags({
    ...repo,
  });
  return tags.includes(tag);
}

async function push (remoteUrl, branchRefspec, force) {
  const repo = await getRepo();
  try {
    const push = await git.push({
      ...repo,
      onAuth,
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
  return getRepo()
    .then((repo) => git.listBranches(repo))
    .then(cliparse.autocomplete.words);
}

async function isShallow () {
  const { dir } = await getRepo();
  try {
    await fs.promises.access(path.join(dir, '.git', 'shallow'));
    return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = {
  addRemote,
  resolveFullCommitId,
  getRemoteCommit,
  getFullBranch,
  getBranchCommit,
  push,
  completeBranches,
  isShallow,
  isExistingTag,
};
