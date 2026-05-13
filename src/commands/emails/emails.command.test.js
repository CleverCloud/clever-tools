import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
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

  describe('happy path', () => {
    it('prints the primary email when there are no secondary addresses', async () => {
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
      assert.strictEqual(result.stderr, '');
    });

    it('prints the primary and secondary email addresses', async () => {
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
      assert.strictEqual(result.stderr, '');
    });

    it('accepts -F as an alias for --format', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/emails' })
        .respond({ status: 200, body: ['b@example.com', 'a@example.com'] })
        .thenRunCli(['emails', '-F', 'json'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.deepStrictEqual(JSON.parse(result.stdout), {
        primary: SELF.email,
        secondary: ['a@example.com', 'b@example.com'],
      });
      assert.strictEqual(result.stderr, '');
    });

    it('prints the result as sorted JSON when --format json is given', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/emails' })
        .respond({ status: 200, body: ['b@example.com', 'a@example.com'] })
        .thenRunCli(['emails', '--format', 'json'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.deepStrictEqual(JSON.parse(result.stdout), {
        primary: SELF.email,
        secondary: ['a@example.com', 'b@example.com'],
      });
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('arguments and options', () => {
    it('rejects an invalid --format value', async () => {
      const result = await newScenario()
        .thenRunCli(['emails', '--format', 'xml'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^format: Invalid option: expected one of "human"\|"json"/);
    });
  });

  describe('API errors', () => {
    it('reports the error body when /v2/self returns a non-2xx status', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['emails'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/self');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });

    it('reports the error body when /v2/self/emails returns a non-2xx status', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/emails' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['emails'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/self returns 401', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['emails'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
