import * as assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { describe, it } from 'node:test';
import { runMarkerProtocol } from './ssh-marker-protocol.js';

interface FakeChild extends EventEmitter {
  stdin: PassThrough;
  stdout: PassThrough;
  stderr: PassThrough;
}

function makeFakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}

/** A minimal in-memory writable stream that accumulates writes into a string. */
function captureStream() {
  let buf = '';
  return {
    write(chunk: string | Buffer) {
      buf += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    },
    get text() {
      return buf;
    },
  };
}

describe('runMarkerProtocol', () => {
  it('strips pre-marker stdout noise and forwards post-marker output', async () => {
    const child = makeFakeChild();
    const out = captureStream();
    const err = captureStream();

    const promise = runMarkerProtocol({
      child,
      command: 'echo hello',
      marker: 'MARK',
      outStream: out as unknown as NodeJS.WritableStream,
      errStream: err as unknown as NodeJS.WritableStream,
    });

    child.stdout.write('Welcome to gateway\nLast login: never\n');
    child.stdout.write('MARK\n');
    child.stdout.write('hello\n');
    child.emit('exit', 0);

    const exitCode = await promise;
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(out.text, 'hello\n');
    assert.strictEqual(err.text, '');
  });

  it('escapes single quotes in the user command when writing exec to stdin', async () => {
    const child = makeFakeChild();
    const stdinReceived = captureStream();
    child.stdin.on('data', (chunk: Buffer) => stdinReceived.write(chunk));

    const promise = runMarkerProtocol({
      child,
      command: `echo "it's working"`,
      marker: 'MARK',
      outStream: captureStream() as unknown as NodeJS.WritableStream,
      errStream: captureStream() as unknown as NodeJS.WritableStream,
    });

    child.stdout.write('MARK\n');
    child.emit('exit', 0);
    await promise;

    assert.strictEqual(stdinReceived.text, `echo 'MARK'\nexec $SHELL --login -c 'echo "it'\\''s working"'\n`);
  });

  it('forwards post-marker stderr unchanged', async () => {
    const child = makeFakeChild();
    const out = captureStream();
    const err = captureStream();

    const promise = runMarkerProtocol({
      child,
      command: 'true',
      marker: 'MARK',
      outStream: out as unknown as NodeJS.WritableStream,
      errStream: err as unknown as NodeJS.WritableStream,
    });

    child.stdout.write('MARK\n');
    child.stderr.write('real-error\n');
    child.emit('exit', 0);
    await promise;

    assert.strictEqual(out.text, '');
    assert.strictEqual(err.text, 'real-error\n');
  });

  it('flushes buffered pre-marker output on non-zero exit when the marker never arrives', async () => {
    const child = makeFakeChild();
    const out = captureStream();
    const err = captureStream();

    const promise = runMarkerProtocol({
      child,
      command: 'echo hello',
      marker: 'MARK',
      outStream: out as unknown as NodeJS.WritableStream,
      errStream: err as unknown as NodeJS.WritableStream,
    });

    child.stderr.write('Host key verification failed.\n');
    child.emit('exit', 255);
    const exitCode = await promise;

    assert.strictEqual(exitCode, 255);
    assert.strictEqual(err.text, 'Host key verification failed.\n');
  });

  it('does not flush pre-marker output on a clean (zero) exit', async () => {
    // Defensive: if ssh exits 0 without ever emitting the marker (shouldn't happen
    // in practice), don't pollute the user's output with gateway banner noise.
    const child = makeFakeChild();
    const out = captureStream();
    const err = captureStream();

    const promise = runMarkerProtocol({
      child,
      command: 'true',
      marker: 'MARK',
      outStream: out as unknown as NodeJS.WritableStream,
      errStream: err as unknown as NodeJS.WritableStream,
    });

    child.stdout.write('Welcome to gateway\n');
    child.emit('exit', 0);
    await promise;

    assert.strictEqual(out.text, '');
    assert.strictEqual(err.text, '');
  });
});
