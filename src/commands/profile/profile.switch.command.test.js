import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { USER_ID } from '../../../test/fixtures/id.js';
import { keys } from '../../../test/keys.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const THREE_PROFILES = {
  version: 1,
  profiles: [
    { alias: 'first', token: 't1', secret: 's1', userId: USER_ID, email: 'first@example.com' },
    { alias: 'second', token: 't2', secret: 's2', userId: USER_ID, email: 'second@example.com' },
    { alias: 'third', token: 't3', secret: 's3', userId: USER_ID, email: 'third@example.com' },
  ],
};

const TWO_PROFILES = {
  version: 1,
  profiles: [
    { alias: 'alpha', token: 't1', secret: 's1', userId: USER_ID, email: 'alpha@example.com' },
    { alias: 'beta', token: 't2', secret: 's2', userId: USER_ID, email: 'beta@example.com' },
  ],
};

const ONE_PROFILE = {
  version: 1,
  profiles: [{ alias: 'solo', token: 't', secret: 's', userId: USER_ID, email: 'solo@example.com' }],
};

describe('profile switch command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('interactive prompt', () => {
    it('drives the select prompt and switches to the chosen profile (PTY)', async () => {
      const result = await newScenario()
        .withConfigFile(THREE_PROFILES)
        .thenRunCli(['profile', 'switch'], {
          pty: true,
          interactions: [{ waitFor: /Select a profile/, send: keys.DOWN + keys.ENTER }],
        })
        .verifyFiles((files) => {
          const after = files.readConfigFile();
          assert.deepStrictEqual(
            after.profiles.map((/** @type {{ alias: string }} */ p) => p.alias),
            ['second', 'first', 'third'],
          );
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(
        result.output,
        dedent`
          ? Select a profile:
            first (first@example.com)
          ❯ second (second@example.com)
            third (third@example.com)✔ Select a profile: second (second@example.com)
          ✓ Switched to profile second (second@example.com)
        `,
      );
    });
  });

  describe('non-interactive bypass', () => {
    it('switches directly when --alias is given (no prompt)', async () => {
      const result = await newScenario()
        .withConfigFile(THREE_PROFILES)
        .thenRunCli(['profile', 'switch', '--alias', 'third'])
        .verifyFiles((files) => {
          const after = files.readConfigFile();
          assert.deepStrictEqual(
            after.profiles.map((/** @type {{ alias: string }} */ p) => p.alias),
            ['third', 'first', 'second'],
          );
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, '✓ Switched to profile third (third@example.com)');
      assert.strictEqual(result.stderr, '');
    });

    it('accepts -a as an alias for --alias', async () => {
      const result = await newScenario()
        .withConfigFile(THREE_PROFILES)
        .thenRunCli(['profile', 'switch', '-a', 'third'])
        .verifyFiles((files) => {
          const after = files.readConfigFile();
          assert.deepStrictEqual(
            after.profiles.map((/** @type {{ alias: string }} */ p) => p.alias),
            ['third', 'first', 'second'],
          );
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, '✓ Switched to profile third (third@example.com)');
      assert.strictEqual(result.stderr, '');
    });

    it('skips the prompt and auto-switches when there are exactly two profiles', async () => {
      const result = await newScenario()
        .withConfigFile(TWO_PROFILES)
        .thenRunCli(['profile', 'switch'])
        .verifyFiles((files) => {
          const after = files.readConfigFile();
          assert.deepStrictEqual(
            after.profiles.map((/** @type {{ alias: string }} */ p) => p.alias),
            ['beta', 'alpha'],
          );
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(
        result.stdout,
        dedent`
          i Switching to beta (beta@example.com)
          ✓ Switched to profile beta (beta@example.com)
        `,
      );
    });

    it('reports already-active when --alias matches the current profile', async () => {
      const result = await newScenario()
        .withConfigFile(THREE_PROFILES)
        .thenRunCli(['profile', 'switch', '--alias', 'first']);

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, 'i Already on profile first (first@example.com)');
    });
  });

  describe('profile resolution errors', () => {
    it('errors when --alias does not match any profile', async () => {
      const result = await newScenario()
        .withConfigFile(THREE_PROFILES)
        .thenRunCli(['profile', 'switch', '--alias', 'unknown'], { expectExitCode: 1 });

      assert.strictEqual(
        result.stderr,
        '[ERROR] Profile "unknown" not found. Available profiles: first, second, third',
      );
    });
  });

  describe('no auth', () => {
    it('errors when no profile is configured', async () => {
      const result = await newScenario().thenRunCli(['profile', 'switch'], { expectExitCode: 1 });

      assert.strictEqual(result.stderr, '[ERROR] No profile found.');
    });

    it('errors when only a single profile is configured', async () => {
      const result = await newScenario()
        .withConfigFile(ONE_PROFILE)
        .thenRunCli(['profile', 'switch'], { expectExitCode: 1 });

      assert.strictEqual(result.stderr, '[ERROR] Only one profile. Use clever login --alias <name> to add another.');
    });

    it('errors when CLEVER_TOKEN/CLEVER_SECRET env-based auth is in use', async () => {
      const result = await newScenario()
        .withConfigFile(TWO_PROFILES)
        .thenRunCli(['profile', 'switch'], {
          env: { CLEVER_TOKEN: 'env-token', CLEVER_SECRET: 'env-secret' },
          expectExitCode: 1,
        });

      assert.match(result.stderr, /Cannot switch profiles while using environment-based authentication/);
    });
  });
});
