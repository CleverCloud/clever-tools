import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { profileConfig } from '../../../test/fixtures/profile.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const TOKEN = 'curl-token';
const SECRET = 'curl-secret';
const PROFILE = profileConfig({ token: TOKEN, secret: SECRET });

/**
 * Build the dynamic help text printed by `clever curl` (it embeds the active API host).
 * @param {string} apiHost
 */
function buildHelpOutput(apiHost) {
  return dedent`
    Usage: clever curl
    Query Clever Cloud's API using Clever Tools credentials. For example:

      clever curl ${apiHost}/v2/self
      clever curl ${apiHost}/v2/summary
      clever curl ${apiHost}/v4/products/zones
      clever curl ${apiHost}/v2/organisations/<ORGANISATION_ID>/applications | jq '.[].id'
      clever curl ${apiHost}/v4/billing/organisations/<ORGANISATION_ID>/<INVOICE_NUMBER>.pdf > invoice.pdf

    Our API documentation is available here :

      https://www.clever.cloud/developers/api/v2/
      https://www.clever.cloud/developers/api/v4/
  `;
}

describe('curl command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {string} */
  let apiHost;

  before(async () => {
    newScenario = await hooks.before();
    apiHost = newScenario.mockClient.baseUrl;
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('calls the API with an OAuth authorization header when given a valid URL', async () => {
      // `-s` silences curl's progress output (which would otherwise pollute stderr)
      await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['curl', '-s', `${apiHost}/v2/self`])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/self');
          const authorization = /** @type {string} */ (calls.first.headers.authorization);
          assert.match(authorization, /^OAuth /);
          assert.match(authorization, new RegExp(`oauth_token="${TOKEN}"`));
          assert.match(authorization, new RegExp(`oauth_signature="[^"]*%26${SECRET}"`));
        });
    });
  });

  describe('help variants', () => {
    it('prints help when called with no arguments', async () => {
      const result = await newScenario()
        .thenRunCli(['curl'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, buildHelpOutput(apiHost));
      assert.strictEqual(result.stderr, '');
    });

    it('prints help when called with --help as the first argument', async () => {
      const result = await newScenario()
        .thenRunCli(['curl', '--help'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, buildHelpOutput(apiHost));
      assert.strictEqual(result.stderr, '');
    });

    it('prints help when called with -h as the first argument', async () => {
      const result = await newScenario()
        .thenRunCli(['curl', '-h'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, buildHelpOutput(apiHost));
      assert.strictEqual(result.stderr, '');
    });

    it('does not call when the last argument is --help', async () => {
      await newScenario()
        .withConfigFile(PROFILE)
        .thenRunCli(['curl', `${apiHost}/v2/self`, '--help'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });
    });
  });

  describe('arguments and options', () => {
    it('errors when no argument matches the configured API host', async () => {
      const result = await newScenario()
        .thenRunCli(['curl', 'https://other-host.example.com/foo'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, `[ERROR] "clever curl" command must be used with ${apiHost}`);
    });
  });

  describe('no auth', () => {
    // `clever curl` shells out to the system `curl` binary, which surfaces 401 directly
    // (HTTP error body, not the friendly NOT_LOGGED_IN_ERROR message). With `-s -f` we get
    // a non-zero exit code; without `-f` curl prints the body to stdout and exits 0. We
    // assert the body-on-stdout path since that's the default behavior.
    it('passes the missing-auth response from the API through to stdout', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['curl', '-s', `${apiHost}/v2/self`])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '{"error":"unauthorized"}');
      assert.strictEqual(result.stderr, '');
    });
  });
});
