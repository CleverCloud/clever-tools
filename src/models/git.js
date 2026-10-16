import fs from 'node:fs';
import path from 'node:path';

import { isFeatureEnabled } from '../config/features.js';
import { Logger } from '../logger.js';
import { findPath } from './fs-utils.js';

/**
 * Abstract base class for git operations.
 * Implementations: GitIsomorphic (JS-based) and GitSystem (system git command)
 */
export class Git {
  /** @type {Git | null} */
  static #instance = null;

  /** @type {string} */
  #name;

  /**
   * @param {string} name - Backend name for logging purposes
   */
  constructor(name) {
    this.#name = name;
  }

  /**
   * Get the git implementation based on the feature flag.
   * Returns a cached instance if available.
   * @returns {Promise<Git>}
   */
  static async get() {
    if (Git.#instance == null) {
      const useSystemGit = isFeatureEnabled('system-git');
      if (useSystemGit) {
        const { GitSystem } = await import('./git-system.js');
        Git.#instance = new GitSystem();
      } else {
        const { GitIsomorphic } = await import('./git-isomorphic.js');
        Git.#instance = new GitIsomorphic();
      }
    }
    return Git.#instance;
  }

  /**
   * Log a debug message for git operations
   * @protected
   * @param {string} operation - The operation name
   * @param {...string} args - Additional arguments to log
   */
  _debug(operation, ...args) {
    const argsStr = args.length > 0 ? ` ${args.join(' ')}` : '';
    Logger.debug(`git(${this.#name}): ${operation}${argsStr}`);
  }

  /**
   * Get the repository directory
   * @protected
   * @returns {Promise<string>}
   */
  async _getRepoDir() {
    try {
      return await findPath('.', '.git');
    } catch {
      throw new Error('Could not find the .git folder');
    }
  }

  /**
   * Check if the repository is a linked git worktree.
   * In a linked worktree (created with `git worktree add`), the top-level `.git`
   * is a file holding a `gitdir:` pointer instead of a directory.
   * @protected
   * @param {string} [dir] - Repository directory (resolved automatically when omitted)
   * @returns {Promise<boolean>}
   */
  async _isLinkedWorktree(dir) {
    const repoDir = dir ?? (await this._getRepoDir());
    try {
      const stats = await fs.promises.stat(path.join(repoDir, '.git'));
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Add a remote to the repository
   * @param {string} _remoteName
   * @param {string} _url
   * @returns {Promise<void>}
   */
  async addRemote(_remoteName, _url) {
    throw new Error('Not implemented');
  }

  /**
   * Resolve a short commit ID to its full form
   * @param {string | null} _commitId
   * @returns {Promise<string | null>}
   */
  async resolveFullCommitId(_commitId) {
    throw new Error('Not implemented');
  }

  /**
   * Get the commit SHA of the master branch on a remote
   * @param {string} _remoteUrl
   * @returns {Promise<string | undefined>}
   */
  async getRemoteCommit(_remoteUrl) {
    throw new Error('Not implemented');
  }

  /**
   * Get the full ref name for a branch
   * @param {string} _branchName - Branch name, or empty string for current branch
   * @returns {Promise<string>}
   */
  async getFullBranch(_branchName) {
    throw new Error('Not implemented');
  }

  /**
   * Get the commit SHA for a branch or tag
   * @param {string} _refspec
   * @returns {Promise<string>}
   */
  async getBranchCommit(_refspec) {
    throw new Error('Not implemented');
  }

  /**
   * Check if a tag exists
   * @param {string} _tag
   * @returns {Promise<boolean>}
   */
  async isExistingTag(_tag) {
    throw new Error('Not implemented');
  }

  /**
   * Push to a remote repository
   * @param {string} _remoteUrl
   * @param {string} _branchRefspec
   * @param {boolean} _force
   * @returns {Promise<object>}
   */
  async push(_remoteUrl, _branchRefspec, _force) {
    throw new Error('Not implemented');
  }

  /**
   * List local branches (for autocompletion)
   * @returns {Promise<string[]>}
   */
  async completeBranches() {
    throw new Error('Not implemented');
  }

  /**
   * Check if the repository is a shallow clone
   * @returns {Promise<boolean>}
   */
  async isShallow() {
    this._debug('isShallow');
    const dir = await this._getRepoDir();
    try {
      await fs.promises.access(path.join(dir, '.git', 'shallow'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the current directory is inside a git repository
   * @returns {Promise<boolean>}
   */
  async isInsideGitRepo() {
    throw new Error('Not implemented');
  }

  /**
   * Check if the git working directory is clean (no uncommitted changes)
   * @returns {Promise<boolean>}
   */
  async isGitWorkingDirectoryClean() {
    throw new Error('Not implemented');
  }
}
