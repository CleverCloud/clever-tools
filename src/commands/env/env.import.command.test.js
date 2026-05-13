import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.js';
import { APP_ALIAS_MUTEX_ERROR, NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { idsCache } from '../../../test/fixtures/ids-cache.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const SUMMARY = {
  user: { id: APP_ID, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [{ id: APP_ID, name: 'test-app', variantSlug: 'node' }],
      addons: [],
      consumers: [],
    },
  ],
};

const APP_IDS_CACHE = idsCache({ owners: { [APP_ID]: ORGA_ID } });

const ENV_ENDPOINT = '/v2/organisations/:ownerId/applications/:appId/env';

const APP_NAME = 'test-app';
const UNKNOWN_APP_ID = 'app_99999999-9999-4999-8999-999999999999';

describe('env import command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('replaces all env vars from name=value lines on stdin', async () => {
      const stdin = dedent`
        FOO=bar
        BAZ="qux quux"
      `;

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'PUT', path: ENV_ENDPOINT })
        .respond({ status: 200, body: {} })
        .thenRunCli(['env', 'import'], { stdin })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.method, 'PUT');
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
          assert.deepStrictEqual(calls.first.body, { FOO: 'bar', BAZ: 'qux quux' });
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });

    it('replaces all env vars from JSON on stdin when --json is given', async () => {
      const stdin = JSON.stringify([
        { name: 'FOO', value: 'bar' },
        { name: 'BAZ', value: 'qux quux' },
      ]);

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'PUT', path: ENV_ENDPOINT })
        .respond({ status: 200, body: {} })
        .thenRunCli(['env', 'import', '--json'], { stdin })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.deepStrictEqual(calls.first.body, { FOO: 'bar', BAZ: 'qux quux' });
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });

    it('accepts -a as an alias for --alias', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
        .when({ method: 'PUT', path: ENV_ENDPOINT })
        .respond({ status: 200, body: {} })
        .thenRunCli(['env', 'import', '-a', 'prod'], { stdin: 'FOO=bar' })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('stdin parsing errors', () => {
    it('errors when name=value input has a duplicate name', async () => {
      const stdin = dedent`
        FOO=1
        FOO=2
      `;

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .thenRunCli(['env', 'import'], { stdin, expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] line 2: be careful, the name FOO is already defined');
    });

    it('errors when --json input is not valid JSON', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .thenRunCli(['env', 'import', '--json'], { stdin: 'not json', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        `[ERROR] Error when parsing JSON input: Unexpected token 'o', "not json" is not valid JSON`,
      );
    });
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory and --app is missing', async () => {
      const result = await newScenario()
        .thenRunCli(['env', 'import'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] There is no linked or targeted application. Use `--app` option or `clever link` command.',
      );
    });

    it('errors when app config has multiple aliases and no --alias is given', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
        .thenRunCli(['env', 'import'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: prod, staging',
      );
    });

    it('errors when --alias does not match any linked application', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
        .thenRunCli(['env', 'import', '--alias', 'unknown'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
    });

    it('errors when both --app and --alias are provided', async () => {
      const result = await newScenario()
        .thenRunCli(['env', 'import', '--app', APP_ID, '--alias', 'test-app'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, APP_ALIAS_MUTEX_ERROR);
    });
  });

  describe('app ID resolution', () => {
    /**
     * @param {ReturnType<NewCliScenario>} scenario
     */
    function withSuccessfulPut(scenario) {
      return scenario.when({ method: 'PUT', path: ENV_ENDPOINT }).respond({ status: 200, body: {} });
    }

    // === app ID (app_<UUID>) ===

    it('resolves an app ID from cache without calling /v2/summary', async () => {
      const result = await withSuccessfulPut(newScenario().withIdsCacheFile(APP_IDS_CACHE))
        .thenRunCli(['env', 'import', '--app', APP_ID], { stdin: 'FOO=bar' })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });

    it('resolves an app ID via /v2/summary when cache is empty', async () => {
      const result = await withSuccessfulPut(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['env', 'import', '--app', APP_ID], { stdin: 'FOO=bar' })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });

    it('errors when an app ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['env', 'import', '--app', UNKNOWN_APP_ID], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when an app ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['env', 'import', '--app', APP_ID], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === app name — goes directly to /v2/summary (no cache lookup) ===

    it('resolves an app name via /v2/summary', async () => {
      const result = await withSuccessfulPut(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['env', 'import', '--app', APP_NAME], { stdin: 'FOO=bar' })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, 'Environment variables have been set');
      assert.strictEqual(result.stderr, '');
    });

    it('errors when an app name is not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['env', 'import', '--app', 'unknown-app'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when /v2/summary returns 404 for an app name', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['env', 'import', '--app', APP_NAME], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] not found');
    });
  });

  describe('API errors', () => {
    it('reports the error body when PUT /v2/organisations/:ownerId/applications/:appId/env returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'PUT', path: ENV_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['env', 'import'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the API returns 401', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'PUT', path: ENV_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['env', 'import'], { stdin: 'FOO=bar', expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
