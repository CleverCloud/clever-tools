import * as git from 'isomorphic-git';
import _ from 'lodash';
import fs from 'node:fs';
import { slugify } from '../lib/slugify.js';
import { loadOAuthConf } from './configuration.js';
import { Git } from './git.js';
import * as http from './isomorphic-http-with-agent.js';

export class GitIsomorphic extends Git {
  constructor() {
    super('isomorphic');
  }

  async #getRepo() {
    const dir = await this._getRepoDir();
    return { fs, dir, http };
  }

  async #onAuth() {
    const tokens = await loadOAuthConf();
    return {
      username: tokens.token,
      password: tokens.secret,
    };
  }

  async addRemote(remoteName, url) {
    this._debug('addRemote', remoteName, url);
    const repo = await this.#getRepo();
    const safeRemoteName = slugify(remoteName);
    const allRemotes = await git.listRemotes({ ...repo });
    const existingRemote = _.find(allRemotes, { remote: safeRemoteName });
    if (existingRemote == null) {
      // In some situations, we may end up with race conditions so we force it
      return git.addRemote({ ...repo, remote: safeRemoteName, url, force: true });
    }
  }

  async resolveFullCommitId(commitId) {
    this._debug('resolveFullCommitId', commitId);
    if (commitId == null) {
      return null;
    }
    try {
      const repo = await this.#getRepo();
      return await git.expandOid({ ...repo, oid: commitId });
    } catch (e) {
      if (e.code === 'ShortOidNotFound') {
        throw new Error(`Commit id ${commitId} is ambiguous`);
      }
      throw e;
    }
  }

  async getRemoteCommit(remoteUrl) {
    this._debug('getRemoteCommit', remoteUrl);
    const repo = await this.#getRepo();
    const remoteInfos = await git.getRemoteInfo({
      ...repo,
      onAuth: this.#onAuth,
      url: remoteUrl,
    });
    return _.get(remoteInfos, 'refs.heads.master');
  }

  async getFullBranch(branchName) {
    this._debug('getFullBranch', branchName);
    const repo = await this.#getRepo();
    if (branchName === '') {
      const currentBranch = await git.currentBranch({ ...repo, fullname: true });
      return currentBranch || 'HEAD';
    }
    return git.expandRef({ ...repo, ref: branchName });
  }

  async getBranchCommit(refspec) {
    this._debug('getBranchCommit', refspec);
    const repo = await this.#getRepo();
    const oid = await git.resolveRef({ ...repo, ref: refspec });
    // When a refspec refers to an annotated tag, the OID ref represents the annotation and not the commit directly,
    // that's why we need a call to `readCommit`.
    const res = await git.readCommit({ ...repo, ref: refspec, oid });
    return res.oid;
  }

  async isExistingTag(tag) {
    this._debug('isExistingTag', tag);
    const repo = await this.#getRepo();
    const tags = await git.listTags({
      ...repo,
    });
    return tags.includes(tag);
  }

  async push(remoteUrl, branchRefspec, force, remoteName) {
    const refspec = `${branchRefspec}:refs/heads/master`;
    this._debug('push', remoteUrl, refspec, force ? '--force' : '');
    const repo = await this.#getRepo();
    try {
      const push = await git.push({
        ...repo,
        onAuth: this.#onAuth,
        url: remoteUrl,
        ref: branchRefspec,
        remoteRef: 'master',
        remote: remoteName,
        force,
      });
      if (push.errors != null) {
        throw new Error(push.errors.join(', '));
      }
      return push;
    } catch (e) {
      if (e.code === 'PushRejectedNonFastForward') {
        throw new Error('Push rejected because it was not a simple fast-forward, use --force to override');
      }
      throw e;
    }
  }

  async completeBranches() {
    this._debug('completeBranches');
    return this.#getRepo().then((repo) => git.listBranches(repo));
  }

  /**
   * Check if the current directory is a git repository
   * @returns {Promise<boolean>}
   */
  async isInsideGitRepo() {
    this._debug('isInsideGitRepo');
    return this.#getRepo()
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Check if the current git working directory is clean
   * @returns {Promise<boolean>}
   */
  async isGitWorkingDirectoryClean() {
    this._debug('isGitWorkingDirectoryClean');
    const repo = await this.#getRepo();
    const status = await git.statusMatrix({ ...repo });
    const isStatusEmpty =
      status.filter(([filepath, head, workdir]) => {
        // WARNING: isomorphic-git does not support global gitignore so we filter hidden files and dirs to reduce the amount of false positives
        const isHidden = filepath.startsWith('.');
        const isCleverJson = filepath === '.clever.json';
        return (!isHidden || isCleverJson) && head !== workdir;
      }).length === 0;
    return isStatusEmpty;
  }
}
