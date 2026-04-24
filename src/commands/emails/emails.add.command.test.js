import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').CliTestKit} CliTestKit
 */

describe('emails add command', () => {
  const hooks = cliHooks();
  /** @type {CliTestKit} */
  let testKit;

  before(async () => {
    testKit = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should write error when address already belongs to account', async () => {
    const result = await testKit
      .newScenario()
      .when({ method: 'PUT', path: `/v2/self/emails/:address` })
      .respond({ status: 400, body: { id: 101 } })
      .thenCall(() => testKit.runCli(['emails', 'add', 'test.user@example.com'], { expectExitCode: 1 }))
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.method, 'PUT');
        assert.strictEqual(calls.first.pathParams?.address, 'test.user@example.com');
      });

    assert.strictEqual(result.stdout, ``);
    assert.strictEqual(result.stderr, `[ERROR] This address already belongs to your account`);
  });
});
