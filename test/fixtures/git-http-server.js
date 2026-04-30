import factory from 'git-http-mock-server/middleware.js';
import { execFileSync } from 'node:child_process';
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
 * Spin up a `git-http-mock-server`-backed HTTP server on a random `127.0.0.1` port.
 *
 * Bare repos are stored under a temp directory (`<tmp>/<appId>.git`) and exposed at
 * `${baseUrl}/${appId}.git`. The `git-http-backend` CGI binary (provided by the system
 * `git`) speaks the smart-HTTP protocol on top.
 *
 * Caveat: `git-http-mock-server` uses `fixturez` copy-on-write on push (`git-receive-pack`),
 * so pushed contents land in a temp copy and the original bare repo under `root` is not
 * mutated. Tests that need to verify a push must rely on API-call assertions, not on
 * reading back from the bare repo.
 *
 * @returns {Promise<MockGitHttpServer>}
 */
export async function startMockGitHttpServer() {
  let root = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-git-'));

  // The factory closes over `config.root` at construction time, so we recreate
  // the middleware on every request to pick up the current `root` after `reset()`.
  /** @type {http.RequestListener} */
  const handler = (req, res) => {
    const middleware = factory({ root, route: '/', glob: '*' });
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('not found\n');
    });
  };

  const server = http.createServer(handler);
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

/**
 * @param {string} cwd
 * @param {...string} args
 * @returns {string}
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
