import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ssh2 from 'ssh2';

const { Server } = ssh2;
const { generateKeyPairSync, parseKey } = ssh2.utils;

/**
 * @typedef {Object} MockSshScript
 * @property {string} [stdout]            Written to channel stdout after the marker echo.
 * @property {string} [stderr]            Written to channel stderr after the marker echo.
 * @property {number} [exitCode]          Defaults to 0.
 * @property {string} [preMarkerStdout]   "Gateway noise" emitted before the marker echo.
 * @property {string} [preMarkerStderr]
 *
 * @typedef {Object} MockSshConnection
 * @property {string} username
 * @property {string} destination         The remote command arg the client passed (== sshTarget == instance_id).
 * @property {string} stdinReceived       Everything the client wrote to channel stdin.
 * @property {string | null} innerCommand The CMD un-escaped from `exec $SHELL --login -c '<CMD>'`, or null if not seen.
 * @property {boolean} authAccepted
 * @property {number} exitCode            The exit code we sent on the channel.
 *
 * @typedef {Object} MockSshServer
 * @property {string} gatewayUri          "ssh://testuser@127.0.0.1:<port>" — set as CLEVER_SSH_GATEWAY.
 * @property {string} identityFile        Absolute path to the client's private key (mode 0600).
 * @property {string} binDir              Directory containing an `ssh` shim that prepends `-F` and `-o UserKnownHostsFile=` to the real ssh. Prepend this to PATH in tests.
 * @property {Array<MockSshConnection>} connections
 * @property {(scripts: Record<string, MockSshScript>) => void} setShellScript
 *   Map from inner-command string → scripted reply. '*' is the wildcard default.
 * @property {() => void} reset
 * @property {() => Promise<void>} close
 */

const MOCK_USERNAME = 'testuser';

/**
 * Start an embedded ssh2 server on 127.0.0.1:<random port>.
 *
 * Generates fresh ed25519 keypairs (one for the host, one for the client) and
 * writes a PATH-overriding `ssh` shim that calls the real ssh with `-F` and
 * `-o UserKnownHostsFile=` baked in. The OpenSSH client expands `~` via the
 * passwd database (not $HOME), so a HOME-based override is not viable.
 *
 * The server speaks the marker protocol from src/commands/ssh/ssh.command.js:
 *   1. Client opens an exec channel with command = instance_id (recorded as `destination`).
 *   2. Client writes `echo '<MARKER>'\n` then `exec $SHELL --login -c '<INNER>'\n` to stdin.
 *   3. Server replies with `<MARKER>\n` to stdout, then the scripted output, then exits.
 *
 * @returns {Promise<MockSshServer>}
 */
export async function startMockSshServer() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-ssh-'));

  const hostKey = generateKeyPairSync('ed25519');
  const clientKey = generateKeyPairSync('ed25519');
  const clientPubKey = parseKeyOrThrow(clientKey.public);
  const hostPubKey = parseKeyOrThrow(hostKey.public);

  const identityFile = path.join(tmpDir, 'id_ed25519');
  fs.writeFileSync(identityFile, clientKey.private, { mode: 0o600 });

  /** @type {Array<MockSshConnection>} */
  const connections = [];
  /** @type {Set<import('ssh2').Connection>} */
  const liveClients = new Set();
  /** @type {Record<string, MockSshScript>} */
  let scripts = {};

  const server = new Server({ hostKeys: [hostKey.private] }, (client) => {
    liveClients.add(client);
    client.once('close', () => liveClients.delete(client));
    /** @type {MockSshConnection} */
    const connection = {
      username: '',
      destination: '',
      stdinReceived: '',
      innerCommand: null,
      authAccepted: false,
      exitCode: 0,
    };

    client.on('authentication', (ctx) => {
      connection.username = ctx.username;
      if (ctx.method !== 'publickey') {
        return ctx.reject(['publickey']);
      }
      if (ctx.key.algo !== clientPubKey.type) {
        return ctx.reject();
      }
      if (!ctx.key.data.equals(clientPubKey.getPublicSSH())) {
        return ctx.reject();
      }
      const { signature, blob } = ctx;
      if (signature == null || blob == null) {
        return ctx.accept();
      }
      const ok = clientPubKey.verify(blob, signature, ctx.hashAlgo);
      if (ok !== true) {
        return ctx.reject();
      }
      connection.authAccepted = true;
      ctx.accept();
    });

    client.on('ready', () => {
      client.on('session', (acceptSession) => {
        const session = acceptSession();
        session.on('pty', (acceptPty) => acceptPty?.());
        session.on('exec', (acceptExec, _reject, info) => {
          connection.destination = info.command;
          const stream = acceptExec();
          handleExec(stream, connection, scripts);
        });
        session.on('shell', (acceptShell) => {
          const stream = acceptShell();
          stream.write('mock-ssh-banner\n');
          stream.stdin.on('end', () => {
            stream.exit(0);
            stream.end();
          });
        });
      });
    });

    client.on('error', () => {});
    connections.push(connection);
  });

  await /** @type {Promise<void>} */ (
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    })
  );
  const { port } = /** @type {{ port: number }} */ (server.address());

  const knownHostsFile = path.join(tmpDir, 'known_hosts');
  const configFile = path.join(tmpDir, 'ssh_config');
  fs.writeFileSync(knownHostsFile, `[127.0.0.1]:${port} ssh-ed25519 ${hostPubKey.getPublicSSH().toString('base64')}\n`);
  fs.writeFileSync(configFile, 'IdentitiesOnly yes\nLogLevel ERROR\n', { mode: 0o600 });

  const realSshPath = resolveRealSshPath();
  const binDir = path.join(tmpDir, 'bin');
  fs.mkdirSync(binDir);
  fs.writeFileSync(
    path.join(binDir, 'ssh'),
    `#!/bin/sh\nexec ${realSshPath} -F ${shellQuote(configFile)} -o UserKnownHostsFile=${shellQuote(knownHostsFile)} "$@"\n`,
    { mode: 0o755 },
  );

  return {
    gatewayUri: `ssh://${MOCK_USERNAME}@127.0.0.1:${port}`,
    identityFile,
    binDir,
    connections,
    setShellScript(newScripts) {
      scripts = { ...newScripts };
    },
    reset() {
      connections.length = 0;
      scripts = {};
    },
    async close() {
      // server.close() resolves only after every open TCP connection has gone away.
      // The CLI calls process.exit(code) after ssh exits, which can leave the server
      // side of the TCP connection lingering for tens of seconds — long enough to wedge
      // a test run. Force-disconnect every live client first.
      for (const client of liveClients) {
        client.end();
      }
      liveClients.clear();
      await /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
      );
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}

const ECHO_MARKER_RE = /^echo '([^']+)'\r?\n/;
const EXEC_LINE_RE = /^exec \$SHELL --login -c '((?:[^']|'\\'')*)'\r?\n/;

/**
 * @param {import('ssh2').ServerChannel} stream
 * @param {MockSshConnection} connection
 * @param {Record<string, MockSshScript>} scripts
 */
function handleExec(stream, connection, scripts) {
  let buf = '';
  let markerSeen = false;
  let preMarkerWritten = false;

  stream.stdin.on('data', (/** @type {Buffer} */ chunk) => {
    buf += chunk.toString();
    connection.stdinReceived += chunk.toString();

    while (true) {
      if (!markerSeen) {
        const m = buf.match(ECHO_MARKER_RE);
        if (m == null) break;
        const consumed = m[0].length;
        const marker = m[1];
        buf = buf.slice(consumed);

        const inner = peekInner(buf);
        const script = pickScript(scripts, inner);
        writePreMarker(stream, script);
        preMarkerWritten = true;
        stream.write(`${marker}\n`);
        markerSeen = true;
        continue;
      }

      const m = buf.match(EXEC_LINE_RE);
      if (m == null) break;
      const consumed = m[0].length;
      const inner = unescapeShellSingleQuote(m[1]);
      buf = buf.slice(consumed);
      connection.innerCommand = inner;

      const script = pickScript(scripts, inner);
      finishExec(stream, connection, script);
      return;
    }
  });

  stream.stdin.on('end', () => {
    if (!preMarkerWritten) {
      const script = pickScript(scripts, null);
      writePreMarker(stream, script);
      preMarkerWritten = true;
    }
    if (connection.innerCommand == null) {
      const script = pickScript(scripts, null);
      finishExec(stream, connection, script);
    }
  });
}

/**
 * @param {string} buf
 * @returns {string | null}
 */
function peekInner(buf) {
  const m = buf.match(EXEC_LINE_RE);
  return m != null ? unescapeShellSingleQuote(m[1]) : null;
}

/**
 * @param {Record<string, MockSshScript>} scripts
 * @param {string | null} inner
 * @returns {MockSshScript}
 */
function pickScript(scripts, inner) {
  if (inner != null && Object.prototype.hasOwnProperty.call(scripts, inner)) {
    return scripts[inner];
  }
  if (Object.prototype.hasOwnProperty.call(scripts, '*')) {
    return scripts['*'];
  }
  return {};
}

/**
 * @param {import('ssh2').ServerChannel} stream
 * @param {MockSshScript} script
 */
function writePreMarker(stream, script) {
  if (script.preMarkerStdout != null) stream.write(script.preMarkerStdout);
  if (script.preMarkerStderr != null) stream.stderr.write(script.preMarkerStderr);
}

/**
 * @param {import('ssh2').ServerChannel} stream
 * @param {MockSshConnection} connection
 * @param {MockSshScript} script
 */
function finishExec(stream, connection, script) {
  if (script.stdout != null) stream.write(script.stdout);
  if (script.stderr != null) stream.stderr.write(script.stderr);
  const exitCode = script.exitCode ?? 0;
  connection.exitCode = exitCode;
  stream.exit(exitCode);
  stream.end();
}

/**
 * Reverse the `'\''` escaping the production code applies to single quotes.
 * @param {string} s
 * @returns {string}
 */
function unescapeShellSingleQuote(s) {
  return s.replaceAll("'\\''", "'");
}

/**
 * Wrap parseKey so the success branch is narrowed (the typedef returns `ParsedKey | Error`).
 * @param {string} pem
 * @returns {import('ssh2').ParsedKey}
 */
function parseKeyOrThrow(pem) {
  const parsed = parseKey(pem);
  if (parsed instanceof Error) throw parsed;
  return /** @type {import('ssh2').ParsedKey} */ (parsed);
}

/**
 * Find the real ssh binary by asking sh to resolve it. We can't rely on
 * `process.env.PATH.split` because we want the same lookup the user's shell does.
 * @returns {string}
 */
function resolveRealSshPath() {
  const r = spawnSync('sh', ['-c', 'command -v ssh'], { encoding: 'utf-8' });
  const out = (r.stdout ?? '').trim();
  if (r.status !== 0 || out === '') {
    throw new Error('ssh binary not found on PATH — install OpenSSH to run these tests');
  }
  return out;
}

/**
 * Quote for inclusion in a /bin/sh script (single-quote escape).
 * @param {string} s
 * @returns {string}
 */
function shellQuote(s) {
  return `'${s.replaceAll("'", "'\\''")}'`;
}
