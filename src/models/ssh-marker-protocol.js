import { randomUUID } from 'node:crypto';

/**
 * Drive the single-command marker protocol over an already-spawned ssh
 * subprocess: write the marker + login-shell exec line into stdin, filter
 * gateway/login noise from stdout, and forward the rest to `outStream` /
 * `errStream`. If ssh exits non-zero before emitting the marker, flush the
 * buffered pre-marker bytes so the failure reason isn't swallowed.
 *
 * @param {object} args
 * @param {{ stdin: NodeJS.WritableStream, stdout: NodeJS.ReadableStream, stderr: NodeJS.ReadableStream, on: (event: string, listener: (...args: any[]) => void) => void }} args.child
 * @param {string} args.command - User command; single quotes get shell-escaped.
 * @param {string} [args.marker] - Override the random marker (used by tests).
 * @param {NodeJS.WritableStream} [args.outStream] - Defaults to `process.stdout`.
 * @param {NodeJS.WritableStream} [args.errStream] - Defaults to `process.stderr`.
 * @returns {Promise<number>} Resolves with ssh's exit code.
 */
export async function runMarkerProtocol({
  child,
  command,
  marker = `__CLEVER_${randomUUID()}__`,
  outStream = process.stdout,
  errStream = process.stderr,
}) {
  // We can't pass the command directly via `ssh gateway 'cmd'` because appId already occupies
  // the remote command slot (used by the gateway for routing). So we write into stdin and use
  // a marker to delimit the start of real output from gateway/login noise.
  child.stdin.write(`echo '${marker}'\n`);

  // `exec $SHELL --login -c` ensures the full login environment is loaded (.bashrc, env vars)
  // while keeping stdout clean (no PTY = no prompt/ANSI noise).
  const escapedCommand = command.replaceAll("'", "'\\''");
  child.stdin.write(`exec $SHELL --login -c '${escapedCommand}'\n`);
  child.stdin.end();

  let started = false;
  let stdoutBuf = '';
  let stderrBuf = '';

  child.stdout.on('data', (chunk) => {
    if (started) {
      outStream.write(chunk);
      return;
    }
    stdoutBuf += chunk.toString();
    const idx = stdoutBuf.indexOf(marker + '\n');
    if (idx !== -1) {
      started = true;
      const rest = stdoutBuf.slice(idx + marker.length + 1);
      if (rest) outStream.write(rest);
      stdoutBuf = '';
    }
  });

  child.stderr.on('data', (chunk) => {
    if (started) {
      errStream.write(chunk);
    } else {
      stderrBuf += chunk.toString();
    }
  });

  const exitCode = await new Promise((resolve) => child.on('exit', resolve));
  // Surface buffered pre-marker output on failure so users see the actual ssh
  // error (auth failure, connection refused, bad key permissions, …) instead
  // of a silent exit-255.
  if (exitCode !== 0 && !started) {
    if (stdoutBuf) outStream.write(stdoutBuf);
    if (stderrBuf) errStream.write(stderrBuf);
  }
  return exitCode;
}
