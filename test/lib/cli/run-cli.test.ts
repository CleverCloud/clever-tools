import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { afterEach, describe, it } from 'node:test';
import { KEYS } from './keys.ts';
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

  describe('interactions', () => {
    /** Asks two questions on stdout, one after the other, then prints both answers. */
    const TWO_QUESTIONS = `
      const readline = require('node:readline');
      const lines = readline.createInterface({ input: process.stdin });
      process.stdout.write('Q1? ');
      lines.once('line', (first) => {
        process.stdout.write('Q2? ');
        lines.once('line', (second) => {
          console.log('A1=' + first + ' A2=' + second);
          lines.close();
        });
      });
    `;

    it('should answer each prompt once it shows up, in order', async () => {
      const result = await runCli(nodePath, ['-e', TWO_QUESTIONS], {
        interactions: [
          { waitFor: 'Q1?', send: 'alpha\n' },
          { waitFor: /Q2\?/, send: 'beta\n' },
        ],
      });

      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, 'Q1? Q2? A1=alpha A2=beta');
      assert.equal(result.terminal, false);
    });

    it('should type a list of inputs in a row', async () => {
      const result = await runCli(nodePath, ['-e', TWO_QUESTIONS], {
        interactions: [{ waitFor: 'Q1?', send: ['alpha\n', 'beta\n'] }],
      });

      assert.equal(result.stdout, 'Q1? Q2? A1=alpha A2=beta');
    });

    it('should close stdin after the last answer', async () => {
      const script = `
        process.stdout.write('Q? ');
        let input = '';
        process.stdin.on('data', (chunk) => { input += chunk; });
        process.stdin.on('end', () => console.log('end after ' + JSON.stringify(input)));
      `;

      const result = await runCli(nodePath, ['-e', script], { interactions: [{ waitFor: 'Q?', send: 'yes\n' }] });

      assert.equal(result.timedOut, false);
      assert.equal(result.stdout, 'Q? end after "yes\\n"');
    });

    it('with an empty send as the last interaction, should close stdin once the prompt shows', async () => {
      const script = `
        process.stdout.write('Q? ');
        process.stdin.on('data', () => console.log('unexpected input'));
        process.stdin.on('end', () => console.log('no answer'));
      `;

      const result = await runCli(nodePath, ['-e', script], { interactions: [{ waitFor: 'Q?', send: [] }] });

      assert.equal(result.timedOut, false);
      assert.equal(result.stdout, 'Q? no answer');
    });

    it('should return the screens the command leaves on stdout and on stderr', async () => {
      const script = `
        process.stderr.write('Q? ');
        process.stdin.once('data', () => {
          process.stdout.write('step 1\\x1B[2K\\x1B[Gstep 2\\n');
          process.stderr.write('\\x1B[2K\\x1B[Gdone\\n');
          process.exit(0);
        });
      `;

      const result = await runCli(nodePath, ['-e', script], { interactions: [{ waitFor: 'Q?', send: 'go\n' }] });

      assert.equal(result.stdout, 'step 2');
      assert.equal(result.stderr, 'done');
    });

    it('with a prompt that never shows up, should reject with the output so far', async () => {
      const script = `
        console.log('something else');
        setInterval(() => {}, 1000);
      `;

      await assert.rejects(
        runCli(nodePath, ['-e', script], {
          interactions: [{ waitFor: 'Q1?', send: 'alpha\n' }],
          interactionTimeout: 300,
        }),
        { message: 'prompt not shown after 300 ms: "Q1?"\noutput so far:\nsomething else\n\n' },
      );
    });

    it('with a command that exits before a prompt, should reject with its output', async () => {
      await assert.rejects(
        runCli(nodePath, ['-e', 'console.log("bye")'], { interactions: [{ waitFor: 'Q1?', send: 'alpha\n' }] }),
        { message: 'the command exited with code 0 before showing "Q1?"\noutput:\nbye\n\n' },
      );
    });

    it('with a key to send, should run the command in a terminal, stdout and stderr merged in output', async () => {
      const script = `
        console.log('stdin is ' + (process.stdin.isTTY ? 'a terminal' : 'a pipe'));
        console.error('on stderr');
        process.stdin.setRawMode(true);
        process.stdin.once('data', (key) => {
          console.log('key ' + JSON.stringify(key.toString()));
          process.exit(0);
        });
      `;

      const result = await runCli(nodePath, ['-e', script], {
        interactions: [{ waitFor: 'on stderr', send: KEYS.DOWN }],
      });

      assert.equal(result.exitCode, 0);
      assert.equal(result.terminal, true);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
      assert.equal(result.output, 'stdin is a terminal\non stderr\nkey "\\u001b[B"');
    });

    it('in a terminal, with Ctrl+C at a prompt that does not read keys, should interrupt the command', async () => {
      const script = `
        process.stdout.write('waiting');
        setInterval(() => {}, 1000);
      `;

      const result = await runCli(nodePath, ['-e', script], {
        interactions: [{ waitFor: 'waiting', send: KEYS.CTRL_C }],
      });

      // Killed by SIGINT, reported like a shell does: 128 + 2. The terminal echoes the key, as for a user.
      assert.equal(result.exitCode, 130);
      assert.equal(result.output, 'waiting^C');
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
