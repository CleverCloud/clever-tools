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
 * CGI-backed git smart-HTTP fixture: same public API as the other two
 * implementations, but the protocol is handled by `git http-backend` — the
 * CGI binary that ships with `git`. This Node server just translates each
 * incoming HTTP request into a CGI invocation: env vars carry the request
 * metadata, stdin carries the body, stdout carries the CGI response
 * (headers block, then body).
 *
 * Compared to the `-native` variant, no protocol logic is re-implemented
 * here, so the behavior matches stock `git` exactly (auth hooks, error
 * codes, capability advertisement, etc.). Compared to the mock-server
 * variant, pushes mutate the bare repo on disk directly.
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
      // `git http-backend` rejects push (`git-receive-pack`) with 403 unless
      // the repo is explicitly marked as accepting it.
      git(repoDir, 'config', 'http.receivepack', 'true');
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
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {() => string} getRoot Resolved lazily so `reset()` is picked up between requests.
 */
function handle(req, res, getRoot) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const ps = spawn('git', ['http-backend'], {
    env: {
      ...process.env,
      GIT_PROJECT_ROOT: getRoot(),
      // Bypass the per-repo `git-daemon-export-ok` marker file requirement.
      GIT_HTTP_EXPORT_ALL: '1',
      PATH_INFO: url.pathname,
      QUERY_STRING: url.search.slice(1),
      REQUEST_METHOD: req.method ?? 'GET',
      CONTENT_TYPE: /** @type {string} */ (req.headers['content-type'] ?? ''),
      CONTENT_LENGTH: /** @type {string} */ (req.headers['content-length'] ?? ''),
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  ps.on('error', (err) => fail(res, err));
  req.pipe(ps.stdin);
  pipeCgiResponse(ps.stdout, res);
}

/**
 * Read the CGI header block from `stdout`, apply it to `res`, then pipe the
 * remaining body. CGI headers end at the first blank line (`\r\n\r\n` per
 * spec, but we tolerate `\n\n` for robustness).
 *
 * @param {NodeJS.ReadableStream} stdout
 * @param {http.ServerResponse} res
 */
function pipeCgiResponse(stdout, res) {
  let buf = Buffer.alloc(0);
  let headersDone = false;

  const onData = (/** @type {Buffer} */ chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const sep = findHeaderEnd(buf);
    if (sep == null) return;

    const [idx, len] = sep;
    applyCgiHeaders(res, buf.subarray(0, idx).toString('utf-8'));
    const rest = buf.subarray(idx + len);

    headersDone = true;
    stdout.off('data', onData);

    if (rest.length > 0) res.write(rest);
    stdout.pipe(res);
  };

  stdout.on('data', onData);
  stdout.on('end', () => {
    if (!headersDone && !res.headersSent) {
      res.statusCode = 500;
      res.end('git http-backend produced no output\n');
    }
  });
}

/**
 * @param {Buffer} buf
 * @returns {[number, number] | null} `[separatorOffset, separatorLength]` or null if not yet present.
 */
function findHeaderEnd(buf) {
  const crlf = buf.indexOf('\r\n\r\n');
  const lf = buf.indexOf('\n\n');
  if (crlf < 0 && lf < 0) return null;
  if (crlf < 0) return [lf, 2];
  if (lf < 0) return [crlf, 4];
  return crlf < lf ? [crlf, 4] : [lf, 2];
}

/**
 * @param {http.ServerResponse} res
 * @param {string} block
 */
function applyCgiHeaders(res, block) {
  for (const line of block.split(/\r?\n/)) {
    if (line === '') continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    // CGI's `Status:` header maps onto the HTTP status line.
    if (name.toLowerCase() === 'status') {
      const m = /^(\d+)(?:\s+(.*))?$/.exec(value);
      if (m) {
        res.statusCode = Number(m[1]);
        if (m[2]) res.statusMessage = m[2];
      }
    } else {
      res.setHeader(name, value);
    }
  }
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

/**
 * @param {string} cwd
 * @param {...string} args
 * @returns {string}
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
