import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { StringDecoder } from 'node:string_decoder';

/**
 * @typedef {{ status: 'completed', exitCode: number }
 *   | { status: 'session-failed', exitCode: number, sshOutput: string }} SshCommandResult
 */

/**
 * Run a single command over an already-spawned ssh subprocess and stream its
 * output to `outStream` / `errStream`, without the gateway/login noise.
 * If the session fails before the command runs, ssh's own output is returned
 * as `sshOutput` so the caller can report why.
 *
 * Implementation: a random marker is echoed before the command, everything
 * received before it is held back as noise.
 *
 * @param {object} args
 * @param {import('node:child_process').ChildProcessWithoutNullStreams} args.sshProcess
 * @param {string} args.command - User command; single quotes get shell-escaped.
 * @param {NodeJS.WritableStream} [args.outStream] - Defaults to `process.stdout`.
 * @param {NodeJS.WritableStream} [args.errStream] - Defaults to `process.stderr`.
 * @returns {Promise<SshCommandResult>} `exitCode` is ssh's exit code (128 + signal number if killed by a signal).
 *   `sshOutput` holds the trimmed output of both streams received before the session failed, in arrival order.
 */
export async function runSshCommand({ sshProcess, command, outStream = process.stdout, errStream = process.stderr }) {
  // ssh may exit before reading stdin (e.g. auth failure): ignore EPIPE, its output tells why
  sshProcess.stdin.on('error', () => {});

  const marker = `__CLEVER_${randomUUID()}__`;

  // We can't pass the command directly via `ssh gateway 'cmd'` because appId already occupies
  // the remote command slot (used by the gateway for routing). So we write into stdin and use
  // a marker to delimit the start of real output from gateway/login noise.
  sshProcess.stdin.write(`echo '${marker}'\n`);

  // Like interactive sessions: bash if available, else /bin/sh ($SHELL may be unset or wrong in Docker containers).
  // Resolved in a fresh /bin/sh so no profile alias or function shadows bash. Login shell (-l, as dash rejects --login)
  // to load profiles and env vars, without PTY to keep stdout free of prompt/ANSI noise.
  const escapedCommand = command.replaceAll("'", "'\\''");
  sshProcess.stdin.write(`exec "$(/bin/sh -c 'command -v bash' || echo /bin/sh)" -l -c '${escapedCommand}'\n`);
  sshProcess.stdin.end();

  // Hold output back until the marker, stream after it: noise on success, the only diagnostics if the session fails before
  // Kept as bytes so multibyte characters split across chunks survive
  const markerLine = Buffer.from(`${marker}\n`);
  let markerReceived = false;
  let markerSearchBuffer = Buffer.alloc(0);

  // Both streams, in arrival order, for the error report.
  // One decoder per stream:
  // - chunks of stdout and stderr interleave
  // - and a multibyte character split across two chunks must not be corrupted by a chunk from the other stream
  let sshOutput = '';
  const stdoutDecoder = new StringDecoder('utf8');
  const stderrDecoder = new StringDecoder('utf8');

  sshProcess.stdout.on('data', (chunk) => {
    if (markerReceived) {
      outStream.write(chunk);
      return;
    }
    markerSearchBuffer = Buffer.concat([markerSearchBuffer, chunk]);
    sshOutput += stdoutDecoder.write(chunk);
    const idx = markerSearchBuffer.indexOf(markerLine);
    if (idx !== -1) {
      markerReceived = true;
      const rest = markerSearchBuffer.subarray(idx + markerLine.length);
      if (rest.length > 0) outStream.write(rest);
      markerSearchBuffer = Buffer.alloc(0);
    }
  });

  sshProcess.stderr.on('data', (chunk) => {
    if (markerReceived) {
      errStream.write(chunk);
      return;
    }
    sshOutput += stderrDecoder.write(chunk);
  });

  // Unlike 'exit', 'close' fires once stdio is drained, so no output is lost
  /** @type {{ code: number | null, signal: NodeJS.Signals | null }} */
  const { code, signal } = await new Promise((resolve, reject) => {
    sshProcess.on('error', reject);
    sshProcess.on('close', (code, signal) => resolve({ code, signal }));
  });

  // Keep the ssh exit code, and never report success for a session killed by a signal
  const exitCode = code ?? 128 + (signal != null ? os.constants.signals[signal] : 0);
  if (markerReceived) {
    return { status: 'completed', exitCode };
  }
  sshOutput += stdoutDecoder.end() + stderrDecoder.end();
  return { status: 'session-failed', exitCode, sshOutput: sshOutput.trim() };
}
