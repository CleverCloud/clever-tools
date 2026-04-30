import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {Object} SeedAppGitRepoOptions
 * @property {Record<string, string>} [initialFiles] Map of path → content. Paths are relative to `dir`. These files (and only these) are committed in the initial commit. Defaults to `{ 'README.md': 'clever-tools test repo\n' }`.
 * @property {string} [branch] Initial branch name (default: `master`).
 * @property {string} [userName] Git committer name (default: `clever-tools-test`).
 * @property {string} [userEmail] Git committer email (default: `test@clever-cloud.com`).
 * @property {string} [message] Commit message (default: `init`).
 *
 * @typedef {Object} SeedAppGitRepoResult
 * @property {string} headCommit Full SHA of the initial commit.
 * @property {string} branch Branch the commit landed on.
 */

/**
 * Initialize a real git repository in `dir` with one initial commit.
 *
 * Sync so callers can chain on it and use `headCommit` in subsequent mock-response
 * configuration. Stages only the paths listed in `initialFiles` (not `git add .`)
 * so any pre-existing files in `dir` (e.g. `.clever.json` written by `withAppConfigFile`)
 * remain untracked.
 *
 * @param {string} dir
 * @param {SeedAppGitRepoOptions} [opts]
 * @returns {SeedAppGitRepoResult}
 */
export function seedAppGitRepo(dir, opts = {}) {
  const {
    initialFiles = { 'README.md': 'clever-tools test repo\n' },
    branch = 'master',
    userName = 'clever-tools-test',
    userEmail = 'test@clever.cloud',
    message = 'init',
  } = opts;

  const stagedPaths = Object.keys(initialFiles);
  if (stagedPaths.length === 0) {
    throw new Error('seedAppGitRepo requires at least one initial file');
  }

  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '--initial-branch', branch);
  git(dir, 'config', 'user.name', userName);
  git(dir, 'config', 'user.email', userEmail);
  git(dir, 'config', 'commit.gpgsign', 'false');

  for (const [relPath, content] of Object.entries(initialFiles)) {
    const full = path.resolve(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  git(dir, 'add', '--', ...stagedPaths);
  git(dir, 'commit', '-m', message, '--', ...stagedPaths);
  const headCommit = git(dir, 'rev-parse', 'HEAD');

  return { headCommit, branch };
}

/**
 * @param {string} cwd
 * @param {...string} args
 * @returns {string}
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
