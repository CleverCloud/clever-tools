import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').CliTestKit} CliTestKit
 */

describe('emails command', () => {
  const hooks = cliHooks();
  /** @type {CliTestKit} */
  let testKit;

  before(async () => {
    testKit = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should return primary email addresses', async () => {
    const result = await testKit
      .newScenario()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: [] })
      .thenCall(() => testKit.runCli(['emails']))
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
      });

    assert.strictEqual(
      result.stdout,
      dedent`
            ✉️  Primary email address:
             • test.user@example.com
          `,
    );
  });

  it('should return primary and secondary email addresses', async () => {
    const result = await testKit
      .newScenario()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: ['test.user+secondary@example.com'] })
      .thenCall(() => testKit.runCli(['emails']))
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
      });

    assert.strictEqual(
      result.stdout,
      dedent`
            ✉️  Primary email address:
             • test.user@example.com

            ✉️  1 secondary email address(es):
             • test.user+secondary@example.com
          `,
    );
  });
});
