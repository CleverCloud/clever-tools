import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

export interface GitServer {
  client: GitClient;
  stop: () => Promise<void>;
}

export async function startGitServer(): Promise<GitServer> {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-git-'));

  const worker = new Worker(new URL('./git-server.worker.ts', import.meta.url), {
    workerData: { root: rootDir },
  });

  const port = await new Promise<number>((resolve, reject) => {
    worker.once('message', (msg) => {
      if (msg?.type === 'ready' && typeof msg.port === 'number') resolve(msg.port);
      else reject(new Error(`unexpected worker message: ${JSON.stringify(msg)}`));
    });
    worker.once('error', reject);
  });
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    client: new GitClient(baseUrl, rootDir),
    async stop() {
      worker.postMessage({ type: 'close' });
      await new Promise((resolve) => worker.once('exit', resolve));
      fs.rmSync(rootDir, { recursive: true, force: true });
    },
  };
}

export class GitClient {
  private readonly _baseUrl: string;
  private readonly _rootDir: string;

  constructor(baseUrl: string, rootDir: string) {
    this._baseUrl = baseUrl;
    this._rootDir = rootDir;
  }

  get baseUrl() {
    return this._baseUrl;
  }

  getRepoUrl(appId: string): string {
    return `${this._baseUrl}/${appId}.git`;
  }

  addRepo(appId: string): string {
    const repoDir = path.join(this._rootDir, `${appId}.git`);
    fs.mkdirSync(repoDir, { recursive: true });
    git(repoDir, 'init', '--bare');
    // `git http-backend` rejects push (`git-receive-pack`) with 403 unless
    // the repo is explicitly marked as accepting it.
    git(repoDir, 'config', 'http.receivepack', 'true');
    return `${this._baseUrl}/${appId}.git`;
  }

  reset() {
    fs.rmSync(this._rootDir, { recursive: true, force: true });
    fs.mkdirSync(this._rootDir);
  }
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
