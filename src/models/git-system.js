import { simpleGit } from 'simple-git';
import { config } from '../config/config.js';
import { slugify } from '../lib/slugify.js';
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
    // The failure used to be recognised from git's own words ("unknown revision", "ambiguous
    // argument"), and git translates that one — it comes from `die(_("ambiguous argument '%s':
    // unknown revision or path not in the working tree…"))` in git's setup.c, wrapped in `_()`.
    // On a git built with its l10n catalogs, the norm on Debian and Ubuntu which ship `git-l10n`,
    // the match failed and the raw git error reached the user instead of a message of ours.
    //
    // `--verify --quiet` answers without prose instead: an id that resolves to nothing exits
    // non-zero with an empty stderr, which simple-git hands back as empty stdout rather than an
    // error, while a genuine failure — an unreadable repository, a malformed `.git/config` — still
    // rejects and carries git's own diagnostic, which deserves to reach the user untouched.
    //
    // This resolves an id, it does not prove the object is here: a full 40-character SHA comes
    // back as itself even when the repository holds no such object, exactly as the previous
    // `rev-parse` call did. `restart --commit` leans on that — the commit it names lives on the
    // remote and need not have been fetched — so do not tighten this into an existence check
    // (`^{commit}`) without looking at that command first.
    const fullOid = (await git.revparse(['--verify', '--quiet', '--end-of-options', commitId])).trim();
    if (fullOid === '') {
      throw new Error(`Could not resolve commit id ${commitId} in this repository`);
    }
    return fullOid;
  }

  async getRemoteCommit(remoteUrl) {
    const git = await this.#getSimpleGit();
    const authUrl = this.#buildAuthenticatedUrl(remoteUrl);
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

  #buildAuthenticatedUrl(url) {
    const urlObj = new URL(url);
    urlObj.username = config.token;
    urlObj.password = config.secret;
    return urlObj;
  }

  async getFullBranch(branchName) {
    this._debug('getFullBranch', branchName);
    const git = await this.#getSimpleGit();
    const ref = branchName === '' ? 'HEAD' : branchName;
    try {
      const fullRef = await git.revparse(['--symbolic-full-name', ref]);
      return fullRef.trim();
    } catch {
      // Not a symbolic ref (e.g. a commit hash), return as-is
      return ref;
    }
  }

  async getBranchCommit(refspec) {
    this._debug('getBranchCommit', refspec);
    const git = await this.#getSimpleGit();
    // `^{commit}` dereferences an annotated tag to the commit it points at. Plain `rev-parse` used
    // to run it bare, so on a repository with no commit the user got git's own words back — the
    // multi-line "Use '--' to separate paths from revisions" hint, quoting the
    // `<refspec>^{commit}` we built rather than anything they typed.
    //
    // `--verify --quiet` separates the two outcomes worth telling apart: a refspec that resolves
    // to nothing exits non-zero with an empty stderr, which simple-git hands back as empty stdout
    // rather than an error, while an unreadable repository or a malformed `.git/config` still
    // rejects and keeps git's diagnostic, which is the one thing here worth showing verbatim.
    //
    // Only the ref is named. Failing to resolve `HEAD` says nothing about the repository holding
    // commits — `git checkout --orphan` leaves HEAD unborn in a repository full of them — so
    // there is no inference to draw beyond the ref that was asked for.
    const oid = (await git.revparse(['--verify', '--quiet', '--end-of-options', `${refspec}^{commit}`])).trim();
    if (oid === '') {
      throw new Error(`Could not resolve ${refspec} to a commit`);
    }
    return oid;
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
    const authUrl = this.#buildAuthenticatedUrl(remoteUrl);
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
      'git was not found in your PATH\n' +
        'Either install git, or fall back to the previous JS implementation with: clever features disable system-git',
    );
    this.name = 'GitNotFoundError';
  }
}
