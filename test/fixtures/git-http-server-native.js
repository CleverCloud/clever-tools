import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

/**
 * @typedef {Object} AddRepoOptions
 * @property {string} [fromLocalRepo] Absolute path to a non-bare local repo whose `master` branch should be force-pushed into the new bare repo. Used so that subsequent `info/refs` calls return the same commit as the local repo (e.g. for the same-commit policy test).
 *
 * @typedef {Object} MockGitHttpServer
 * @property {string} baseUrl                                    `http://127.0.0.1:<port>`.
 * @property {(appId: string) => string} getRepoUrl              Convenience: `${baseUrl}/${appId}.git`.
 * @property {(appId: string, opts?: AddRepoOptions) => void} addRepo
 * @property {() => void} reset                                  Wipe and recreate the fixtures root.
 * @property {() => Promise<void>} close                         Stop the server, rm the temp root.
 */

/**
 * Native git smart-HTTP fixture: same public API as `git-http-server.js`, but
 * with no `git-http-mock-server` dependency. The smart-HTTP protocol is spoken
 * directly by spawning the system `git-upload-pack` / `git-receive-pack`
 * binaries on top of bare repos under a temp root.
 *
 * Behavioral difference vs. the wrapped version: pushes mutate the bare repo
 * on disk directly (no `fixturez` copy-on-write layer).
 *
 * @returns {Promise<MockGitHttpServer>}
 */
export async function startMockGitHttpServer() {
  let root = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-git-'));

  const server = http.createServer((req, res) => handle(req, res, () => root));
  await /** @type {Promise<void>} */ (
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    })
  );
  const { port } = /** @type {{ port: number }} */ (server.address());
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    getRepoUrl(appId) {
      return `${baseUrl}/${appId}.git`;
    },
    addRepo(appId, { fromLocalRepo } = {}) {
      const repoDir = path.join(root, `${appId}.git`);
      fs.mkdirSync(repoDir, { recursive: true });
      git(repoDir, 'init', '--bare');
      if (fromLocalRepo != null) {
        git(fromLocalRepo, 'push', '--force', repoDir, 'master:refs/heads/master');
      }
    },
    reset() {
      fs.rmSync(root, { recursive: true, force: true });
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-git-'));
    },
    async close() {
      await /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
      );
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

const REFS_RE = /^\/([^/]+\.git)\/info\/refs$/;
const RPC_RE = /^\/([^/]+\.git)\/(git-upload-pack|git-receive-pack)$/;

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {() => string} getRoot Resolved lazily so `reset()` is picked up between requests.
 */
function handle(req, res, getRoot) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const refsMatch = req.method === 'GET' ? REFS_RE.exec(url.pathname) : null;
  if (refsMatch) {
    const service = url.searchParams.get('service');
    if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
      return notFound(res);
    }
    const gitDir = path.join(getRoot(), refsMatch[1]);
    if (!fs.existsSync(gitDir)) return notFound(res);

    res.setHeader('content-type', `application/x-${service}-advertisement`);
    res.write(pktLine(`# service=${service}\n`) + '0000');
    const ps = spawn(service, ['--stateless-rpc', '--advertise-refs', gitDir]);
    ps.stdout.pipe(res);
    ps.on('error', (err) => fail(res, err));
    return;
  }

  const rpcMatch = req.method === 'POST' ? RPC_RE.exec(url.pathname) : null;
  if (rpcMatch) {
    const repo = rpcMatch[1];
    const service = rpcMatch[2];
    const expected = `application/x-${service}-request`;
    if (req.headers['content-type'] !== expected) return notFound(res);
    const gitDir = path.join(getRoot(), repo);
    if (!fs.existsSync(gitDir)) return notFound(res);

    res.setHeader('content-type', `application/x-${service}-result`);
    const ps = spawn(service, ['--stateless-rpc', gitDir]);
    req.pipe(ps.stdin);
    ps.stdout.pipe(res);
    ps.on('error', (err) => fail(res, err));
    return;
  }

  notFound(res);
}

/** @param {http.ServerResponse} res */
function notFound(res) {
  res.statusCode = 404;
  res.end('not found\n');
}

/**
 * @param {http.ServerResponse} res
 * @param {Error} err
 */
function fail(res, err) {
  if (res.headersSent) {
    res.destroy(err);
    return;
  }
  res.statusCode = 500;
  res.end(String(err) + '\n');
}

/** @param {string} s */
function pktLine(s) {
  const n = (4 + s.length).toString(16);
  return '0'.repeat(4 - n.length) + n + s;
}

/**
 * @param {string} cwd
 * @param {...string} args
 * @returns {string}
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
