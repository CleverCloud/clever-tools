import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import pkg from '../../../package.json' with { type: 'json' };
import { cliHooks } from '../../../test/cli-hooks.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const OAUTH_RESPONSE = {
  token: 'oauth-token',
  secret: 'oauth-secret',
  expirationDate: '2099-01-01T00:00:00.000Z',
};

describe('login command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('skips the browser and saves the profile when --token and --secret are provided', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login', '--token', 'provided-token', '--secret', 'provided-secret'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/self');
        })
        .verifyFiles((fsRead) => {
          const configFile = fsRead.readConfigFile();
          assert.strictEqual(configFile.version, 1);
          assert.strictEqual(configFile.profiles.length, 1);
          assert.deepStrictEqual(configFile.profiles[0], {
            alias: 'default',
            token: 'provided-token',
            secret: 'provided-secret',
            userId: SELF.id,
            email: SELF.email,
          });
        });

      assert.strictEqual(result.stdout, `✓ Login successful as default (test.user@example.com)`);
      assert.strictEqual(result.stderr, '');
    });

    it('opens the browser at the Console OAuth URL and saves the profile on successful poll', async () => {
      /** @type {string|undefined} */
      let cliToken;

      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self/cli_tokens' })
        .respond({ status: 200, body: OAUTH_RESPONSE })
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/self/cli_tokens');
          assert.strictEqual(calls.last.path, '/v2/self');
          cliToken = /** @type {string|undefined} */ (calls.first.queryParams?.cli_token);
        })
        .verifyFiles((fsRead) => {
          const configFile = fsRead.readConfigFile();
          assert.deepStrictEqual(configFile.profiles[0], {
            alias: 'default',
            token: OAUTH_RESPONSE.token,
            secret: OAUTH_RESPONSE.secret,
            expirationDate: OAUTH_RESPONSE.expirationDate,
            userId: SELF.id,
            email: SELF.email,
          });
        });

      const expectedUrl = `https://console.clever-cloud.com/cli-oauth?cli_version=${pkg.version}&cli_token=${cliToken}`;

      assert.strictEqual(
        result.stdout,
        dedent`
          🌐 Opening ${expectedUrl} in your browser to log you in…
          ✓ Login successful as default (${SELF.email})
        `,
      );
      assert.strictEqual(result.stderr, '');
    });

    it('opens the browser at the overridden Console OAuth URL when --console-url is given', async () => {
      const consoleUrlOverride = 'https://console.test.example.com';

      /** @type {string|undefined} */
      let expectedUrl;

      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self/cli_tokens' })
        .respond({ status: 200, body: OAUTH_RESPONSE })
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login', '--console-url', consoleUrlOverride])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          expectedUrl = `${consoleUrlOverride}/cli-oauth?cli_version=${pkg.version}&cli_token=${calls.first.queryParams?.cli_token}`;
        })
        .verifyFiles((fsRead) => {
          assert.deepStrictEqual(fsRead.readConfigFile().profiles[0].overrides, {
            CONSOLE_URL: consoleUrlOverride,
          });
        });

      assert.strictEqual(
        result.stdout,
        dedent`
          🌐 Opening ${expectedUrl} in your browser to log you in…
          ✓ Login successful as default (${SELF.email})
        `,
      );
      assert.strictEqual(result.stderr, '');
    });

    it('saves the profile under the given --alias', async () => {
      await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login', '--token', 't', '--secret', 's', '--alias', 'staging'])
        .verifyFiles((fsRead) => {
          assert.strictEqual(fsRead.readConfigFile().profiles[0].alias, 'staging');
        });
    });

    it('persists every override flag in profile.overrides', async () => {
      // Skipping --api-host here so /v2/self still hits the mock host injected via env;
      // the remaining overrides exercise the persistence path on their own.
      await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli([
          'login',
          '--token',
          't',
          '--secret',
          's',
          '--auth-bridge-host',
          'https://bridge.example.com',
          '--ssh-gateway',
          'gateway.example.com',
          '--oauth-consumer-key',
          'k',
          '--oauth-consumer-secret',
          'cs',
        ])
        .verifyFiles((fsRead) => {
          assert.deepStrictEqual(fsRead.readConfigFile().profiles[0].overrides, {
            AUTH_BRIDGE_HOST: 'https://bridge.example.com',
            SSH_GATEWAY: 'gateway.example.com',
            OAUTH_CONSUMER_KEY: 'k',
            OAUTH_CONSUMER_SECRET: 'cs',
          });
        });
    });
  });

  describe('arguments and options', () => {
    it('errors when --token is given without --secret', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--token', 'a-token'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Both `--token` and `--secret` must be defined');
    });

    it('errors when --secret is given without --token', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--secret', 'a-secret'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Both `--token` and `--secret` must be defined');
    });

    it('rejects "$env" as an --alias (reserved for env-based auth)', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--token', 't', '--secret', 's', '--alias', '$env'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^alias: .+reserved/);
    });

    it('rejects an --alias with disallowed characters', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--token', 's', '--secret', 's', '--alias', 'has space'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^alias: .+letters, numbers, hyphens and underscores/);
    });

    // --api-host schema is `z.string().url()`.
    it('rejects an --api-host that is not a valid URL', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--api-host', 'not-a-url'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^api-host: Invalid URL/);
    });

    // --console-url schema is `z.string().url()`.
    it('rejects a --console-url that is not a valid URL', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--console-url', 'not-a-url'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^console-url: Invalid URL/);
    });

    // --auth-bridge-host schema is `z.string().url()`.
    it('rejects an --auth-bridge-host that is not a valid URL', async () => {
      const result = await newScenario()
        .thenRunCli(['login', '--auth-bridge-host', 'not-a-url'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^auth-bridge-host: Invalid URL/);
    });
  });

  describe('existing profile warning', () => {
    it('warns when a profile with the same alias already exists (old profile config)', async () => {
      const existingProfile = {
        alias: 'default',
        token: 'old-token',
        secret: 'old-secret',
        userId: 'user_old',
        email: 'old.user@example.com',
      };

      /** @type {string|undefined} */
      let expectedUrl;

      const result = await newScenario()
        .withConfigFile(existingProfile)
        .when({ method: 'GET', path: '/v2/self/cli_tokens' })
        .respond({ status: 200, body: { token: 'new-token', secret: 'new-secret' } })
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          expectedUrl = `https://console.clever-cloud.com/cli-oauth?cli_version=${pkg.version}&cli_token=${calls.first.queryParams?.cli_token}`;
        });

      const expectedStdout = dedent`
        You are already logged in with profile default; this login may overwrite it.
        Press Ctrl+C to cancel, then run clever login --alias <another-alias>.

        🌐 Opening ${expectedUrl} in your browser to log you in…
        ✓ Login successful as default (${SELF.email})
      `;
      assert.strictEqual(result.stdout, expectedStdout);
      assert.strictEqual(result.stderr, '');
    });

    it('warns when a profile with the same alias already exists (profile config v1)', async () => {
      const existingProfile = {
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'old-token',
            secret: 'old-secret',
            userId: 'user_old',
            email: 'old.user@example.com',
          },
        ],
      };

      /** @type {string|undefined} */
      let expectedUrl;

      const result = await newScenario()
        .withConfigFile(existingProfile)
        .when({ method: 'GET', path: '/v2/self/cli_tokens' })
        .respond({ status: 200, body: { token: 'new-token', secret: 'new-secret' } })
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .thenRunCli(['login'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          expectedUrl = `https://console.clever-cloud.com/cli-oauth?cli_version=${pkg.version}&cli_token=${calls.first.queryParams?.cli_token}`;
        });

      const expectedStdout = dedent`
        You are already logged in with profile default (old.user@example.com); this login may overwrite it.
        Press Ctrl+C to cancel, then run clever login --alias <another-alias>.

        🌐 Opening ${expectedUrl} in your browser to log you in…
        ✓ Login successful as default (${SELF.email})
      `;
      assert.strictEqual(result.stdout, expectedStdout);
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('API errors', () => {
    // `login` is the entry point for authentication, so the unauthenticated case is rendered as
    // "[ERROR] You're not logged in" here — same as any other command. There is no dedicated
    // "no auth" describe for this command.
    it('reports the not-logged-in error when /v2/self returns 401', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['login', '--token', 'bad-token', '--secret', 'bad-secret'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.match(
        result.stderr,
        /^\[ERROR\] You're not logged in, use clever login command to connect to your Clever Cloud account/,
      );
    });
  });
});
