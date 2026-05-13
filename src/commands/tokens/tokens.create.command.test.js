import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { profileConfig } from '../../../test/fixtures/profile.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const PROFILE = profileConfig();

const CREATED_TOKEN = {
  apiTokenId: 'tk_00000000-0000-0000-0000-000000000001',
  apiToken: 'cct_v1.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  expirationDate: '2026-10-01T00:00:00.000Z',
};

describe('tokens create command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {string} */
  let mockHost;

  before(async () => {
    newScenario = await hooks.before();
    mockHost = newScenario.mockClient.baseUrl;
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('prompts for password and 2FA then creates the token (TOTP user)', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'my-token', '--expiration', '2026-10-01'], {
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '123456\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/self');
          assert.strictEqual(calls.last.method, 'POST');
          assert.strictEqual(calls.last.path, '/api-tokens');
          assert.deepStrictEqual(calls.last.body, {
            email: SELF.email,
            password: 'hunter2',
            mfaCode: '123456',
            name: 'my-token',
            description: '',
            expirationDate: '2026-10-01T00:00:00.000Z',
          });
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(
        result.stdout,
        dedent`
          ✔ API token successfully created! Store it securely, you won't able to print it again.

            - API token ID : ${CREATED_TOKEN.apiTokenId}
            - API token    : ${CREATED_TOKEN.apiToken}
            - Expiration   : 2026-10-01 00:00

          Export this token and use it to make authenticated requests to the Clever Cloud API through the Auth Bridge:

          export CC_API_TOKEN=${CREATED_TOKEN.apiToken}
          curl -H "Authorization: Bearer $CC_API_TOKEN" ${mockHost}/v2/self

          Then, to revoke this token, run:
          clever tokens revoke ${CREATED_TOKEN.apiTokenId}
        `,
      );
    });

    it('prompts only for password when the user has no TOTP', async () => {
      await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: { ...SELF, preferredMFA: 'NONE' } })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'no-totp', '--expiration', '2026-10-01'], {
          interactions: [{ waitFor: /Enter your password/, send: 'hunter2\n' }],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.deepStrictEqual(calls.last.body, {
            email: SELF.email,
            password: 'hunter2',
            name: 'no-totp',
            description: '',
            expirationDate: '2026-10-01T00:00:00.000Z',
          });
        });
    });

    it('prints JSON when --format json is given', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'json-token', '--expiration', '2026-10-01', '--format', 'json'], {
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '123456\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.deepStrictEqual(JSON.parse(result.stdout), CREATED_TOKEN);
    });

    it('accepts -e as an alias for --expiration', async () => {
      await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'short-alias', '-e', '2026-10-01'], {
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '123456\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          const body = /** @type {{ expirationDate: string }} */ (calls.last.body);
          assert.strictEqual(body.expirationDate, '2026-10-01T00:00:00.000Z');
        });
    });

    it('accepts a duration (e.g. 1h) as --expiration', async () => {
      await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'duration-token', '--expiration', '1h'], {
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '123456\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          // The expiration date is "now + 1h"; we only check the shape (ISO 8601), not the value.
          const body = /** @type {{ expirationDate: string }} */ (calls.last.body);
          assert.match(body.expirationDate, /^\d{4}-\d{2}-\d{2}T/);
        });
    });

    it('uses the default 1-year expiration when --expiration is omitted', async () => {
      await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 200, body: CREATED_TOKEN })
        .thenRunCli(['tokens', 'create', 'default-expiry'], {
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '123456\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          const body = /** @type {{ expirationDate: string }} */ (calls.last.body);
          assert.match(body.expirationDate, /^\d{4}-\d{2}-\d{2}T/);
        });
    });
  });

  describe('arguments and options', () => {
    it('errors when the api-token-name argument is missing', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .thenRunCli(['tokens', 'create'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^api-token-name: missing value/);
    });

    // --expiration schema is `z.string().default('1y').transform(futureDateOrDuration)` — the
    // transform throws when fed an ISO 8601 duration prefix it can't parse.
    it('errors when --expiration is not a valid duration', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .thenRunCli(['tokens', 'create', 'foo', '--expiration', 'P_NOT_VALID'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^expiration: Invalid duration: "P_NOT_VALID"/);
    });

    // --format schema is `z.enum(['human', 'json'])`.
    it('errors when --format is not in the allowed enum', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .thenRunCli(['tokens', 'create', 'foo', '--format', 'xml'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^format: Invalid option: expected one of "human"\|"json"/);
    });
  });

  describe('preflight checks', () => {
    it('errors when the account has no password (GitHub-only)', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: { ...SELF, hasPassword: false } })
        .thenRunCli(['tokens', 'create', 'no-pw'], { expectExitCode: 1 })
        .verify((calls) => {
          // Only /v2/self should be called — no POST to /api-tokens.
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/self');
        });

      assert.strictEqual(
        result.stderr,
        dedent`
          [ERROR] ! Your Clever Cloud account is linked via GitHub and has no password. Setting one is required to create API tokens.
                  → To do so, go to the following URL: https://console.clever-cloud.com/users/me/api-tokens
        `,
      );
    });

    it('errors when --expiration is more than 1 year in the future', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['tokens', 'create', 'too-far', '--expiration', '2099-01-01'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/self');
        });

      assert.strictEqual(result.stderr, '[ERROR] You cannot set an expiration date greater than 1 year');
    });
  });

  describe('API errors on POST /api-tokens', () => {
    it('reports a clear error for code=invalid-credential', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 400, body: { code: 'invalid-credential' } })
        .thenRunCli(['tokens', 'create', 'bad-pw', '--expiration', '2026-10-01'], {
          expectExitCode: 1,
          interactions: [
            { waitFor: /Enter your password/, send: 'wrong\n' },
            { waitFor: /Enter your 2FA code/, send: '000000\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stderr, '[ERROR] Invalid credentials, check your password');
    });

    it('reports a clear error for code=invalid-mfa-code', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'POST', path: '/api-tokens' })
        .respond({ status: 400, body: { code: 'invalid-mfa-code' } })
        .thenRunCli(['tokens', 'create', 'bad-2fa', '--expiration', '2026-10-01'], {
          expectExitCode: 1,
          interactions: [
            { waitFor: /Enter your password/, send: 'hunter2\n' },
            { waitFor: /Enter your 2FA code/, send: '999999\n' },
          ],
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stderr, '[ERROR] Invalid credentials, check your 2FA code');
    });
  });

  describe('API errors on GET /v2/self', () => {
    it('reports the error body when /v2/self returns a non-2xx status', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['tokens', 'create', 'failing'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/self returns 401', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['tokens', 'create', 'unauthorized'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
