import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.js';
import { APP_ALIAS_MUTEX_ERROR } from '../../../test/fixtures/errors.js';
import { ADDON_ID, APP_ID, ORGA_ID, UUID } from '../../../test/fixtures/id.js';
import { idsCache } from '../../../test/fixtures/ids-cache.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const REAL_ADDON_ID = `postgresql_${UUID}`;
const APP_NAME = 'test-app';
const ADDON_NAME = 'my-db';
const UNKNOWN_APP_ID = 'app_99999999-9999-4999-8999-999999999999';

const SUMMARY = {
  user: { ...SELF, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [{ id: APP_ID, name: APP_NAME, variantSlug: 'node' }],
      addons: [{ id: ADDON_ID, realId: REAL_ADDON_ID, name: ADDON_NAME, providerId: 'postgresql-addon' }],
      consumers: [],
    },
  ],
};

const APP_IDS_CACHE = idsCache({ owners: { [APP_ID]: ORGA_ID } });

const ADDON_IDS_CACHE = idsCache({
  owners: {
    [ADDON_ID]: ORGA_ID,
    [REAL_ADDON_ID]: ORGA_ID,
  },
  addons: {
    [ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
    [REAL_ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
  },
});

const LOGS_APP_ENDPOINT = '/v4/logs/organisations/:ownerId/applications/:appId/logs';
const LOGS_ADDON_ENDPOINT = '/v4/logs/organisations/:ownerId/resources/:realAddonId/logs';

/** @type {import('@clevercloud/doublure').MockSseEventMessage} */
const ENDED_BY_LIMIT_EVENT = { type: 'message', event: 'END_OF_STREAM', data: JSON.stringify({ endedBy: 'limit' }) };
/** @type {import('@clevercloud/doublure').MockSseEventClose} */
const CLOSE_EVENT = { type: 'close' };

const WAITING_FOR_APP_LOGS = 'Waiting for application logs…';
const WAITING_FOR_ADDON_LOGS = 'Waiting for addon logs…';

describe('logs command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('streams app log events from the SSE endpoint', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: LOGS_APP_ENDPOINT })
        .respond({
          status: 200,
          events: [
            {
              type: 'message',
              event: 'APPLICATION_LOG',
              data: JSON.stringify({ id: '1', message: 'log message 1', date: '2026-04-24T10:00:00Z' }),
            },
            {
              type: 'message',
              event: 'APPLICATION_LOG',
              data: JSON.stringify({ id: '2', message: 'log message 2', date: '2026-04-24T10:00:01Z' }),
            },
            ENDED_BY_LIMIT_EVENT,
            CLOSE_EVENT,
          ],
          delayBetween: 10,
        })
        .thenRunCli(['logs'], { stripAnsi: false })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      const reset = '\x1B[0m';
      assert.strictEqual(
        result.stdout,
        dedent`Waiting for application logs…
        2026-04-24T10:00:00.000Z: log message 1${reset}
        2026-04-24T10:00:01.000Z: log message 2${reset}`,
      );
      assert.strictEqual(result.stderr, '');
    });

    it('prints only the header when the stream closes with no log events', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: LOGS_APP_ENDPOINT })
        .respond({ status: 200, events: [ENDED_BY_LIMIT_EVENT, CLOSE_EVENT], delayBetween: 10 })
        .thenRunCli(['logs'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, 'Waiting for application logs…');
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory and --app is missing', async () => {
      const result = await newScenario()
        .thenRunCli(['logs'], { expectExitCode: 1 })
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
        .thenRunCli(['logs'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(
        result.stderr,
        '[ERROR] Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: prod, staging',
      );
    });

    it('errors when --alias does not match any linked application', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
        .thenRunCli(['logs', '--alias', 'unknown'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
    });

    it('errors when both --app and --alias are provided', async () => {
      const result = await newScenario()
        .thenRunCli(['logs', '--app', APP_ID, '--alias', 'prod'], { expectExitCode: 1 })
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
    function withAppLogStream(scenario) {
      return scenario
        .when({ method: 'GET', path: LOGS_APP_ENDPOINT })
        .respond({ status: 200, events: [ENDED_BY_LIMIT_EVENT, CLOSE_EVENT], delayBetween: 10 });
    }

    // === app ID (app_<UUID>) ===

    it('resolves an app ID from cache without calling /v2/summary', async () => {
      const result = await withAppLogStream(newScenario().withIdsCacheFile(APP_IDS_CACHE))
        .thenRunCli(['logs', '--app', APP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_APP_LOGS);
    });

    it('resolves an app ID via /v2/summary when cache is empty', async () => {
      const result = await withAppLogStream(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['logs', '--app', APP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_APP_LOGS);
    });

    it('errors when an app ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['logs', '--app', UNKNOWN_APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when an app ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['logs', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === app name — goes directly to /v2/summary (no cache lookup) ===

    it('resolves an app name via /v2/summary', async () => {
      const result = await withAppLogStream(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['logs', '--app', APP_NAME])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_APP_LOGS);
    });

    it('errors when an app name is not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['logs', '--app', 'unknown-app'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when /v2/summary returns 404 for an app name', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['logs', '--app', APP_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });
  });

  describe('addon ID resolution', () => {
    /**
     * @param {ReturnType<NewCliScenario>} scenario
     */
    function withAddonLogStream(scenario) {
      return scenario
        .when({ method: 'GET', path: LOGS_ADDON_ENDPOINT })
        .respond({ status: 200, events: [ENDED_BY_LIMIT_EVENT, CLOSE_EVENT], delayBetween: 10 });
    }

    // === addon ID (addon_<UUID>) ===

    it('resolves an addon ID from cache without calling /v2/summary', async () => {
      const result = await withAddonLogStream(newScenario().withIdsCacheFile(ADDON_IDS_CACHE))
        .thenRunCli(['logs', '--addon', ADDON_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.realAddonId, REAL_ADDON_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_ADDON_LOGS);
    });

    it('resolves an addon ID via /v2/summary when cache is empty', async () => {
      const result = await withAddonLogStream(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['logs', '--addon', ADDON_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.realAddonId, REAL_ADDON_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_ADDON_LOGS);
    });

    it('errors when an addon ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['logs', '--addon', 'addon_unknown'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] Add-on addon_unknown does not exist');
    });

    it('errors when an addon ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['logs', '--addon', ADDON_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === real ID (postgresql_<UUID>) ===

    it('resolves a real ID from cache without calling /v2/summary', async () => {
      const result = await withAddonLogStream(newScenario().withIdsCacheFile(ADDON_IDS_CACHE))
        .thenRunCli(['logs', '--addon', REAL_ADDON_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.realAddonId, REAL_ADDON_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_ADDON_LOGS);
    });

    it('resolves a real ID via /v2/summary when cache is empty', async () => {
      const result = await withAddonLogStream(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['logs', '--addon', REAL_ADDON_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.realAddonId, REAL_ADDON_ID);
        });

      assert.strictEqual(result.stdout, WAITING_FOR_ADDON_LOGS);
    });

    it('errors when a real ID is not in cache and not in /v2/summary', async () => {
      const unknownRealId = 'postgresql_99999999-9999-9999-9999-999999999999';
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['logs', '--addon', unknownRealId], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, `[ERROR] Add-on ${unknownRealId} does not exist`);
    });

    it('errors when a real ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['logs', '--addon', REAL_ADDON_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === addon name — not supported by resolveAddon, always errors ===

    it('errors when an addon name is passed (cache hit by name is not supported)', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['logs', '--addon', ADDON_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, `[ERROR] Add-on ${ADDON_NAME} does not exist`);
    });
  });

  describe('arguments and options', () => {
    it('errors when --format json is given without a limiting parameter (--until)', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .thenRunCli(['logs', '--format', 'json'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(
        result.stderr,
        '[ERROR] "json" format is only applicable with a limiting parameter such as `--until`',
      );
    });

    // --format schema is `z.enum(['human', 'json', 'json-stream'])`.
    it('errors when --format is not in the allowed enum', async () => {
      const result = await newScenario()
        .thenRunCli(['logs', '--format', 'xml'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^format: Invalid option: expected one of "human"\|"json"\|"json-stream"/);
    });

    // --before schema is `z.string().transform(date)`; the transform throws on unparseable ISO durations.
    it('errors when --before is not a valid date or duration', async () => {
      const result = await newScenario()
        .thenRunCli(['logs', '--before', 'P_NOT_VALID'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^before: Invalid duration: "P_NOT_VALID"/);
    });

    // --after schema is `z.string().transform(date)`; same transform as --before.
    it('errors when --after is not a valid date or duration', async () => {
      const result = await newScenario()
        .thenRunCli(['logs', '--after', 'P_NOT_VALID'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^after: Invalid duration: "P_NOT_VALID"/);
    });
  });

  describe('no auth', () => {
    // The SSE path uses its own error renderer and surfaces raw `HTTP error 401: <body>`
    // rather than the friendly NOT_LOGGED_IN_ERROR message from send-to-api's processError.
    it('reports an HTTP 401 when the log stream endpoint rejects the request', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: LOGS_APP_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['logs'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stderr, '[ERROR] HTTP error 401: {"error":"unauthorized"}');
    });
  });
});
