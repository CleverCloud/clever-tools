import fs from 'node:fs';
import path from 'node:path';

import { isFeatureEnabled } from './configuration.js';
import { findPath } from './fs-utils.js';

/**
 * Abstract base class for git operations.
 * Implementations: GitIsomorphic (JS-based) and GitSystem (system git command)
 */
export class Git {
  /** @type {Git | null} */
  static #instance = null;

  /**
   * Get the git implementation based on the feature flag.
   * Returns a cached instance if available.
   * @returns {Promise<Git>}
   */
  static async get() {
    if (Git.#instance == null) {
      const useSystemGit = await isFeatureEnabled('system-git');
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
   * Get the repository directory
   * @protected
   * @returns {Promise<string>}
   */
  async _getRepoDir() {
    try {
      return await findPath('.', '.git');
    } catch {
      throw new Error('Not in a git repository');
    }
  }

  /**
   * Add a remote to the repository
   * @param {string} remoteName
   * @param {string} url
   * @returns {Promise<void>}
   */
  async addRemote(remoteName, url) {
    throw new Error('Not implemented');
  }

  /**
   * Resolve a short commit ID to its full form
   * @param {string | null} commitId
   * @returns {Promise<string | null>}
   */
  async resolveFullCommitId(commitId) {
    throw new Error('Not implemented');
  }

  /**
   * Get the commit SHA of the master branch on a remote
   * @param {string} remoteUrl
   * @returns {Promise<string | undefined>}
   */
  async getRemoteCommit(remoteUrl) {
    throw new Error('Not implemented');
  }

  /**
   * Get the full ref name for a branch
   * @param {string} branchName - Branch name, or empty string for current branch
   * @returns {Promise<string>}
   */
  async getFullBranch(branchName) {
    throw new Error('Not implemented');
  }

  /**
   * Get the commit SHA for a branch or tag
   * @param {string} refspec
   * @returns {Promise<string>}
   */
  async getBranchCommit(refspec) {
    throw new Error('Not implemented');
  }

  /**
   * Check if a tag exists
   * @param {string} tag
   * @returns {Promise<boolean>}
   */
  async isExistingTag(tag) {
    throw new Error('Not implemented');
  }

  /**
   * Push to a remote repository
   * @param {string} remoteUrl
   * @param {string} branchRefspec
   * @param {boolean} force
   * @returns {Promise<object>}
   */
  async push(remoteUrl, branchRefspec, force) {
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
