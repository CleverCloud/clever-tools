import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

describe('emails add command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('adds a secondary email address', async () => {
      const result = await newScenario()
        .when({ method: 'PUT', path: '/v2/self/emails/:address' })
        .respond({ status: 200, body: {} })
        .thenRunCli(['emails', 'add', 'test.user+secondary@example.com'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.method, 'PUT');
          assert.strictEqual(calls.first.pathParams?.address, 'test.user+secondary@example.com');
        });

      assert.strictEqual(
        result.stdout,
        '✓ The server sent a confirmation email to test.user+secondary@example.com to validate your secondary address',
      );
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('arguments and options', () => {
    it('errors when the email argument is missing', async () => {
      const result = await newScenario()
        .thenRunCli(['emails', 'add'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^email: missing value/);
      assert.strictEqual(result.stderr, '');
    });

    // emailArg.schema is `z.string().email()` — exercises zod's email validator.
    it('errors when the email argument fails the z.string().email() schema', async () => {
      const result = await newScenario()
        .thenRunCli(['emails', 'add', 'not-an-email'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^email: Invalid email address/);
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('API errors on PUT /v2/self/emails/:address', () => {
    it('reports a clear error for id=101 (address already on account)', async () => {
      const result = await newScenario()
        .when({ method: 'PUT', path: '/v2/self/emails/:address' })
        .respond({ status: 400, body: { id: 101 } })
        .thenRunCli(['emails', 'add', 'test.user@example.com'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] This address already belongs to your account');
    });

    it('reports a clear error for id=550 (invalid format)', async () => {
      const result = await newScenario()
        .when({ method: 'PUT', path: '/v2/self/emails/:address' })
        .respond({ status: 400, body: { id: 550 } })
        .thenRunCli(['emails', 'add', 'test.user@example.com'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] The format of this address is invalid');
    });

    it('reports a clear error for id=1004 (belongs to another account)', async () => {
      const result = await newScenario()
        .when({ method: 'PUT', path: '/v2/self/emails/:address' })
        .respond({ status: 400, body: { id: 1004 } })
        .thenRunCli(['emails', 'add', 'test.user@example.com'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] This address belongs to another account');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the API returns 401', async () => {
      const result = await newScenario()
        .when({ method: 'PUT', path: '/v2/self/emails/:address' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['emails', 'add', 'test.user@example.com'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
