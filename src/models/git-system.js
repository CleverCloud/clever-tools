import { simpleGit } from 'simple-git';
import { slugify } from '../lib/slugify.js';
import { loadOAuthConf } from './configuration.js';
import { Git } from './git.js';

export class GitSystem extends Git {
  #gitAvailabilityChecked = false;

  constructor() {
    super('system');
  }

  async addRemote(remoteName, url) {
    this._debug('addRemote', remoteName, url);
    const git = await this.#getSimpleGit();
    const safeRemoteName = slugify(remoteName);
    const remotes = await git.getRemotes();
    const existingRemote = remotes.find((r) => r.name === safeRemoteName);
    if (existingRemote == null) {
      await git.addRemote(safeRemoteName, url);
    }
  }

  async #getSimpleGit() {
    await this.#checkGitAvailability();
    const dir = await this._getRepoDir();
    return simpleGit(dir);
  }

  async #checkGitAvailability() {
    if (this.#gitAvailabilityChecked) {
      return;
    }
    const git = simpleGit();
    const ver = await git.version();
    if (!ver.installed) {
      throw new GitNotFoundError();
    }
    this.#gitAvailabilityChecked = true;
  }

  async resolveFullCommitId(commitId) {
    this._debug('resolveFullCommitId', commitId);
    if (commitId == null) {
      return null;
    }
    const git = await this.#getSimpleGit();
    try {
      const fullOid = await git.revparse([commitId]);
      return fullOid.trim();
    } catch (e) {
      if (e.message.includes('unknown revision') || e.message.includes('ambiguous argument')) {
        throw new Error(`Commit id ${commitId} is ambiguous`);
      }
      throw e;
    }
  }

  async getRemoteCommit(remoteUrl) {
    const git = await this.#getSimpleGit();
    const authUrl = await this.#buildAuthenticatedUrl(remoteUrl);
    this._debug('getRemoteCommit', this.#redactUrl(authUrl));
    try {
      const result = await git.listRemote(['--refs', authUrl.toString()]);
      // Parse output: "<sha>\trefs/heads/master"
      const lines = result.trim().split('\n');
      for (const line of lines) {
        const [sha, ref] = line.split('\t');
        if (ref === 'refs/heads/master') {
          return sha;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  async #buildAuthenticatedUrl(url) {
    const tokens = await loadOAuthConf();
    const urlObj = new URL(url);
    urlObj.username = tokens.token;
    urlObj.password = tokens.secret;
    return urlObj;
  }

  async getFullBranch(branchName) {
    this._debug('getFullBranch', branchName);
    const git = await this.#getSimpleGit();
    if (branchName === '') {
      const branch = await git.branch();
      if (branch.current) {
        return `refs/heads/${branch.current}`;
      }
      return 'HEAD';
    }
    // Try to expand the ref
    try {
      const fullRef = await git.revparse(['--symbolic-full-name', branchName]);
      return fullRef.trim();
    } catch {
      // If it fails, it might be a commit hash, return as-is
      return branchName;
    }
  }

  async getBranchCommit(refspec) {
    this._debug('getBranchCommit', refspec);
    const git = await this.#getSimpleGit();
    // Use rev-parse with ^{commit} to dereference tags to their commit
    const oid = await git.revparse([`${refspec}^{commit}`]);
    return oid.trim();
  }

  async isExistingTag(tag) {
    this._debug('isExistingTag', tag);
    const git = await this.#getSimpleGit();
    const tags = await git.tags();
    return tags.all.includes(tag);
  }

  #redactUrl(url) {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const redacted = new URL(urlObj.toString());
    if (redacted.username) redacted.username = '***';
    if (redacted.password) redacted.password = '***';
    return redacted.toString();
  }

  async push(remoteUrl, branchRefspec, force) {
    const git = await this.#getSimpleGit();
    const authUrl = await this.#buildAuthenticatedUrl(remoteUrl);
    const refspec = `${branchRefspec}:refs/heads/master`;
    this._debug('push', this.#redactUrl(authUrl), refspec, force ? '--force' : '');
    const options = ['--porcelain'];
    if (force) {
      options.push('--force');
    }
    try {
      await git.push(authUrl.toString(), refspec, options);
      return {};
    } catch (e) {
      if (e.message.includes('non-fast-forward') || e.message.includes('[rejected]')) {
        throw new Error('Push rejected because it was not a simple fast-forward, use --force to override');
      }
      throw e;
    }
  }

  async completeBranches() {
    this._debug('completeBranches');
    const git = await this.#getSimpleGit();
    const branches = await git.branchLocal();
    return branches.all;
  }

  async isInsideGitRepo() {
    this._debug('isInsideGitRepo');
    try {
      await this._getRepoDir();
      return true;
    } catch {
      return false;
    }
  }

  async isGitWorkingDirectoryClean() {
    this._debug('isGitWorkingDirectoryClean');
    const git = await this.#getSimpleGit();
    const status = await git.status();
    return status.isClean();
  }
}

class GitNotFoundError extends Error {
  constructor() {
    super(
      'The system git feature requires git to be installed and available in your PATH\n' +
        'Either install git or disable this feature with: clever features disable system-git',
    );
    this.name = 'GitNotFoundError';
  }
}
