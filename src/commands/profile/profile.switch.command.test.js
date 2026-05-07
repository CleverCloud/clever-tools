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

describe('profile switch command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

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
      [
        '? Select a profile:',
        '  first (first@example.com)',
        '❯ second (second@example.com)',
        '  third (third@example.com)✔ Select a profile: second (second@example.com)',
        '✓ Switched to profile second (second@example.com)',
      ].join('\n'),
    );
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
      'i Switching to beta (beta@example.com)\n✓ Switched to profile beta (beta@example.com)',
    );
  });

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
  });

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
