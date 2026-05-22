import * as assert from 'node:assert';
import { dirname, resolve } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCli } from './cli-runner.ts';
import { keys } from './keys.ts';

const __filename = fileURLToPath(import.meta.url);
const FIXTURE_PATH = resolve(dirname(__filename), 'fixtures/prompt-script.ts');
const SELECT_FIXTURE_PATH = resolve(dirname(__filename), 'fixtures/select-script.ts');

// Fixtures are .ts files. The CLI runner spawns them as bare scripts via node, so we
// have to wedge the strip-types flag in front of the script path. cli-runner.ts treats
// args as either CLI flags (when CLEVER_BIN points at a native binary) or as
// "[clever-binary, ...args]" (default). Here we set CLEVER_BIN=process.execPath so the
// args we pass are read as `node <args>`; prepending the flag puts it in front of the
// script.
const TS_RUN_ARGS = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'];

describe('cli-runner', () => {
  let originalBin: string | undefined;

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
    const result = await runCli([...TS_RUN_ARGS, FIXTURE_PATH], {
      interactions: [
        { waitFor: /Q1\?/, send: 'alpha\n' },
        { waitFor: /Q2\?/, send: 'beta\n' },
      ],
    });

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, 'A1=alpha\nA2=beta');
  });

  it('exposes per-interaction output via result.segments', async () => {
    const result = await runCli([...TS_RUN_ARGS, FIXTURE_PATH], {
      interactions: [
        { waitFor: /Q1\?/, send: 'alpha\n' },
        { waitFor: /Q2\?/, send: 'beta\n' },
      ],
    });

    assert.strictEqual(result.segments.length, 3);
    assert.strictEqual(result.segments[0], 'Q1? ');
    assert.strictEqual(result.segments[1], 'Q2? ');
    assert.strictEqual(result.segments[2], 'A1=alpha\nA2=beta\n');
  });

  it('returns a single-element segments array when no interactions are configured', async () => {
    const result = await runCli([...TS_RUN_ARGS, FIXTURE_PATH], { stdin: 'first\nsecond\n' });

    assert.strictEqual(result.segments.length, 1);
    assert.ok(result.segments[0].includes('A1=first'));
    assert.ok(result.segments[0].includes('A2=second'));
  });

  it('strips ANSI escapes when matching waitFor', async () => {
    // The fixture renders Q1 with cyan color codes; without ANSI stripping, an anchored
    // regex like /^Q1\? $/m would not match the raw "\x1B[36mQ1?\x1B[39m ".
    const result = await runCli([...TS_RUN_ARGS, FIXTURE_PATH], {
      interactions: [
        { waitFor: /^Q1\? $/m, send: 'one\n' },
        { waitFor: /Q2\?/, send: 'two\n' },
      ],
    });

    assert.strictEqual(result.stdout, 'A1=one\nA2=two');
  });

  it('fails fast when a prompt never appears', async () => {
    await assert.rejects(
      runCli([...TS_RUN_ARGS, FIXTURE_PATH], {
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
      runCli([...TS_RUN_ARGS, FIXTURE_PATH], {
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
    const result = await runCli([...TS_RUN_ARGS, FIXTURE_PATH], { stdin: 'first\nsecond\n' });

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, 'A1=first\nA2=second');
  });

  describe('PTY mode', () => {
    beforeEach(() => {
      process.env.CLEVER_BIN = process.execPath;
    });

    it('drives a raw-mode @inquirer/select prompt with arrow keys', async () => {
      const result = await runCli([...TS_RUN_ARGS, SELECT_FIXTURE_PATH], {
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
      const result = await runCli([...TS_RUN_ARGS, SELECT_FIXTURE_PATH], {
        pty: true,
        interactions: [{ waitFor: /Pick one/, send: keys.ENTER }],
      });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.output, '✔ Pick one Alpha\nPICKED=alpha');
    });

    it('times out cleanly when the expected prompt never appears', async () => {
      await assert.rejects(
        runCli([...TS_RUN_ARGS, SELECT_FIXTURE_PATH], {
          pty: true,
          interactions: [{ waitFor: /never-shown/, send: keys.ENTER, timeoutMs: 500 }],
        }),
        /Interaction timed out after 500ms/,
      );
    });
  });
});
