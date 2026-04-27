import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

describe('emails command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should return primary email addresses', async () => {
    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: [] })
      .thenRunCli(['emails'])
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
    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: ['test.user+secondary@example.com'] })
      .thenRunCli(['emails'])
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
