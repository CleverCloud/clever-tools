import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import pkg from '../../../package.json' with { type: 'json' };
import { cliHooks } from '../../../test/cli-hooks.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

describe('login command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should error when --token is given without --secret', async () => {
    const result = await newScenario()
      .thenRunCli(['login', '--token', 'a-token'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Both `--token` and `--secret` must be defined');
  });

  it('should error when --secret is given without --token', async () => {
    const result = await newScenario()
      .thenRunCli(['login', '--secret', 'a-secret'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Both `--token` and `--secret` must be defined');
  });

  it('should skip the browser and save the profile when --token and --secret are provided', async () => {
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
    assert.strictEqual(result.stderr, ``);
  });

  it('should open the browser at the Console OAuth URL and save the profile on successful poll', async () => {
    const oauthResponse = {
      token: 'oauth-token',
      secret: 'oauth-secret',
      expirationDate: '2099-01-01T00:00:00.000Z',
    };

    /** @type {string|undefined} */
    let cliToken;

    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/self/cli_tokens' })
      .respond({ status: 200, body: oauthResponse })
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
        assert.strictEqual(configFile.profiles.length, 1);
        assert.deepStrictEqual(configFile.profiles[0], {
          alias: 'default',
          token: oauthResponse.token,
          secret: oauthResponse.secret,
          expirationDate: oauthResponse.expirationDate,
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

  it('should open the browser at the overridden Console OAuth URL and save the profile with the overridden URL', async () => {
    const consoleUrlOverride = 'https://console.test.example.com';

    const oauthResponse = {
      token: 'oauth-token',
      secret: 'oauth-secret',
      expirationDate: '2099-01-01T00:00:00.000Z',
    };

    /** @type {string|undefined} */
    let expectedUrl;

    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/self/cli_tokens' })
      .respond({ status: 200, body: oauthResponse })
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .thenRunCli(['login', '--console-url', consoleUrlOverride])
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
        assert.strictEqual(calls.first.path, '/v2/self/cli_tokens');
        assert.strictEqual(calls.last.path, '/v2/self');
        expectedUrl = `${consoleUrlOverride}/cli-oauth?cli_version=${pkg.version}&cli_token=${calls.first.queryParams?.cli_token}`;
      })
      .verifyFiles((fsRead) => {
        const configFile = fsRead.readConfigFile();
        assert.strictEqual(configFile.profiles.length, 1);
        assert.deepStrictEqual(configFile.profiles[0], {
          alias: 'default',
          token: oauthResponse.token,
          secret: oauthResponse.secret,
          expirationDate: oauthResponse.expirationDate,
          userId: SELF.id,
          email: SELF.email,
          overrides: { CONSOLE_URL: consoleUrlOverride },
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

  it('should warn when a profile with the same alias already exists (old profile config)', async () => {
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
        assert.strictEqual(calls.first.path, '/v2/self/cli_tokens');
        assert.strictEqual(calls.last.path, '/v2/self');
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

  it('should warn when a profile with the same alias already exists (profile config version 1)', async () => {
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
        assert.strictEqual(calls.first.path, '/v2/self/cli_tokens');
        assert.strictEqual(calls.last.path, '/v2/self');
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

  it('should save the profile under the given --alias', async () => {
    await newScenario()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .thenRunCli(['login', '--token', 't', '--secret', 's', '--alias', 'staging'])
      .verifyFiles((fsRead) => {
        const configFile = fsRead.readConfigFile();
        assert.strictEqual(configFile.profiles[0].alias, 'staging');
      });
  });
});
