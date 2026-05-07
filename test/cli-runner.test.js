import * as assert from 'node:assert';
import { dirname, resolve } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCli } from './cli-runner.js';
import { keys } from './keys.js';

const __filename = fileURLToPath(import.meta.url);
const FIXTURE_PATH = resolve(dirname(__filename), 'fixtures/prompt-script.js');
const SELECT_FIXTURE_PATH = resolve(dirname(__filename), 'fixtures/select-script.js');

describe('cli-runner', () => {
  /** @type {string | undefined} */
  let originalBin;

  beforeEach(() => {
    originalBin = process.env.CLEVER_BIN;
    // Point the runner at the fixture as if it were a native binary so spawn calls it directly.
    process.env.CLEVER_BIN = process.execPath;
  });

  afterEach(() => {
    if (originalBin == null) {
      delete process.env.CLEVER_BIN;
    } else {
      process.env.CLEVER_BIN = originalBin;
    }
  });

  it('drives sequential prompts via the interactions queue', async () => {
    const result = await runCli([FIXTURE_PATH], {
      interactions: [
        { waitFor: /Q1\?/, send: 'alpha\n' },
        { waitFor: /Q2\?/, send: 'beta\n' },
      ],
    });

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, 'A1=alpha\nA2=beta');
  });

  it('strips ANSI escapes when matching waitFor', async () => {
    // The fixture renders Q1 with cyan color codes; without ANSI stripping, an anchored
    // regex like /^Q1\? $/m would not match the raw "\x1B[36mQ1?\x1B[39m ".
    const result = await runCli([FIXTURE_PATH], {
      interactions: [
        { waitFor: /^Q1\? $/m, send: 'one\n' },
        { waitFor: /Q2\?/, send: 'two\n' },
      ],
    });

    assert.strictEqual(result.stdout, 'A1=one\nA2=two');
  });

  it('fails fast when a prompt never appears', async () => {
    await assert.rejects(
      runCli([FIXTURE_PATH], {
        interactions: [
          { waitFor: /Q1\?/, send: 'x\n' },
          { waitFor: /never-shown/, send: 'y\n', timeoutMs: 200 },
        ],
      }),
      /Interaction timed out after 200ms waiting for/,
    );
  });

  it('rejects when the CLI exits with interactions still queued', async () => {
    await assert.rejects(
      runCli([FIXTURE_PATH], {
        interactions: [
          { waitFor: /Q1\?/, send: 'a\n' },
          { waitFor: /Q2\?/, send: 'b\n' },
          { waitFor: /Q3\?/, send: 'c\n', timeoutMs: 1000 },
        ],
      }),
      /CLI exited before all interactions ran|Interaction timed out/,
    );
  });

  it('still supports the existing static stdin path', async () => {
    const result = await runCli([FIXTURE_PATH], { stdin: 'first\nsecond\n' });

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, 'A1=first\nA2=second');
  });

  describe('PTY mode', () => {
    beforeEach(() => {
      process.env.CLEVER_BIN = process.execPath;
    });

    it('drives a raw-mode @inquirer/select prompt with arrow keys', async () => {
      const result = await runCli([SELECT_FIXTURE_PATH], {
        pty: true,
        interactions: [{ waitFor: /Pick one/, send: keys.DOWN + keys.DOWN + keys.ENTER }],
      });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stderr, '');
      assert.strictEqual(
        result.output,
        [
          '? Pick one',
          '  Alpha',
          '❯ Beta',
          '  Gamma? Pick one',
          '  Alpha',
          '  Beta',
          '❯ Gamma✔ Pick one Gamma',
          'PICKED=gamma',
        ].join('\n'),
      );
    });

    it('selects the first choice with ENTER alone', async () => {
      const result = await runCli([SELECT_FIXTURE_PATH], {
        pty: true,
        interactions: [{ waitFor: /Pick one/, send: keys.ENTER }],
      });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.output, '✔ Pick one Alpha\nPICKED=alpha');
    });

    it('times out cleanly when the expected prompt never appears', async () => {
      await assert.rejects(
        runCli([SELECT_FIXTURE_PATH], {
          pty: true,
          interactions: [{ waitFor: /never-shown/, send: keys.ENTER, timeoutMs: 500 }],
        }),
        /Interaction timed out after 500ms/,
      );
    });
  });
});
