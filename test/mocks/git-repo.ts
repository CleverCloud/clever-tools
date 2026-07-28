import { execFileSync } from 'node:child_process';

export class GitRepo {
  private readonly _branch = 'master';
  private readonly _remoteUrl: string;
  private readonly _rootDir: string;
  private _headCommit: string | undefined;

  constructor(serverUrl: string, directory: string, appId: string) {
    this._remoteUrl = `${serverUrl}/${appId}.git`;
    this._rootDir = directory;

    git(this._rootDir, 'init', '--initial-branch', this._branch);
    git(this._rootDir, 'config', 'user.name', 'clever-tools-test');
    git(this._rootDir, 'config', 'user.email', 'test@clever.cloud');
    git(this._rootDir, 'config', 'commit.gpgsign', 'false');
  }

  get remoteUrl() {
    return this._remoteUrl;
  }

  get headCommit() {
    return this._headCommit;
  }

  commitAll(message = 'commit all') {
    git(this._rootDir, 'add', '--all');
    git(this._rootDir, 'commit', '-v', '-m', message);
    this._headCommit = git(this._rootDir, 'rev-parse', 'HEAD');
    return this._headCommit;
  }

  push() {
    return git(this._rootDir, 'push', this._remoteUrl, `${this._branch}:refs/heads/${this._branch}`);
  }
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
