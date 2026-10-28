import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { afterEach, describe, it } from 'node:test';
import { runCli } from './run-cli.ts';

const nodePath = process.execPath;

describe('runCli', () => {
  describe('result', () => {
    it('should return stdout and stderr separately, and join them in output', async () => {
      const result = await runCli('sh', ['-c', 'echo out; echo err >&2']);

      assert.equal(result.stdout, 'out');
      assert.equal(result.stderr, 'err');
      assert.equal(result.output, 'out\nerr');
    });

    it('with one stream empty, should not add a separator', async () => {
      const onlyOut = await runCli('sh', ['-c', 'echo out']);
      const onlyErr = await runCli('sh', ['-c', 'echo err >&2']);

      assert.equal(onlyOut.output, 'out');
      assert.equal(onlyErr.output, 'err');
    });

    it('should trim leading and trailing whitespace of each stream', async () => {
      const result = await runCli('sh', ['-c', 'printf "  \\n out \\n\\n"']);

      assert.equal(result.stdout, 'out');
    });

    it('with a success, should return exit code 0', async () => {
      const result = await runCli('sh', ['-c', 'exit 0']);

      assert.equal(result.exitCode, 0);
    });

    it('should return the exit code of the command without throwing', async () => {
      const result = await runCli('sh', ['-c', 'exit 3']);

      assert.equal(result.exitCode, 3);
    });

    it('with a command that ends in time, should not flag it as timed out', async () => {
      const result = await runCli('sh', ['-c', 'exit 0']);

      assert.equal(result.timedOut, false);
    });

    it('with a multi-byte character split across two chunks, should keep it', async () => {
      const script = `
        const bytes = Buffer.from('✔');
        process.stdout.write(bytes.subarray(0, 1));
        setTimeout(() => process.stdout.write(bytes.subarray(1)), 50);
      `;

      const result = await runCli(nodePath, ['-e', script]);

      assert.equal(result.stdout, '✔');
    });
  });

  describe('stdin', () => {
    it('should send stdin to the command', async () => {
      const result = await runCli('cat', [], { stdin: 'hello' });

      assert.equal(result.stdout, 'hello');
    });

    it('with no stdin given, should close stdin, so the command does not wait for input', async () => {
      const result = await runCli('cat', [], { timeout: 5000 });

      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, '');
    });

    it('should accept a Buffer as stdin', async () => {
      const result = await runCli('cat', [], { stdin: Buffer.from('héllo') });

      assert.equal(result.stdout, 'héllo');
    });

    it('with a command that exits without reading a large stdin, should resolve', async () => {
      const result = await runCli('sh', ['-c', 'exit 0'], { stdin: 'x'.repeat(5 * 1024 * 1024) });

      assert.equal(result.exitCode, 0);
    });
  });

  describe('environment', () => {
    const variable = 'RUN_CLI_TEST_VARIABLE';
    const printVariable = `process.stdout.write(String(process.env.${variable}))`;

    afterEach(() => {
      delete process.env[variable];
    });

    it('should not leak the env of the parent process into the command', async () => {
      process.env[variable] = 'from-parent';

      const result = await runCli(nodePath, ['-e', printVariable]);

      assert.equal(result.stdout, 'undefined');
    });

    it('should pass the given env to the command', async () => {
      const result = await runCli(nodePath, ['-e', printVariable], { env: { [variable]: 'from-test' } });

      assert.equal(result.stdout, 'from-test');
    });

    it('should run the command in the given cwd', async () => {
      const directory = fs.realpathSync(os.tmpdir());

      const result = await runCli(nodePath, ['-e', 'process.stdout.write(process.cwd())'], { cwd: directory });

      assert.equal(result.stdout, directory);
    });
  });

  describe('errors', () => {
    it('with a command that is not found, should reject', async () => {
      await assert.rejects(runCli('does-not-exist-run-cli', []), {
        message: 'Command not found: does-not-exist-run-cli',
      });
    });

    it('with a command that takes too long, should kill it and flag the result', async () => {
      const script = `
        console.log('started');
        setInterval(() => {}, 1000);
      `;

      const result = await runCli(nodePath, ['-e', script], { timeout: 500 });

      assert.equal(result.timedOut, true);
      assert.equal(result.stdout, 'started');

      // SIGKILL is asynchronous: leave the OS a moment to reap the process.
      await new Promise((resolve) => setTimeout(resolve, 200));
      assert.throws(() => process.kill(result.pid, 0), { code: 'ESRCH' });
    });

    it('with a subprocess keeping the output open, should still resolve at the timeout', async () => {
      const start = Date.now();

      const result = await runCli('sh', ['-c', 'sleep 3; echo done'], { timeout: 300 });

      assert.equal(result.timedOut, true);
      assert.ok(Date.now() - start < 2000, 'should not wait for the subprocess');
    });
  });
});
