import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { ORGA_ID, UUID } from '../../../test/fixtures/id.js';
import { profileConfig } from '../../../test/fixtures/profile.js';
import { startMockRedis } from '../../../test/fixtures/redis-server.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 * @typedef {import('../../../test/fixtures/redis-server.js').MockRedisServer} MockRedisServer
 */

const PROFILE = profileConfig();

const KV_NAME = 'myKv';
const KV_ADDON_ID = `addon_${UUID}`;
const KV_REAL_ID = `kv_${UUID}`;

const SUMMARY = {
  user: { ...SELF, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [],
      addons: [{ id: KV_ADDON_ID, realId: KV_REAL_ID, name: KV_NAME, providerId: 'kv' }],
      consumers: [],
    },
  ],
};

const ENABLED_FEATURES = { kv: true };

describe('kv command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {MockRedisServer} */
  let redis;

  before(async () => {
    newScenario = await hooks.before();
    redis = await startMockRedis();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    redis.reset();
  });

  after(async () => {
    await redis.close();
    await hooks.after();
  });

  /**
   * Mock the API calls every successful kv invocation needs:
   * /v2/summary lookup and the addon env-vars lookup that returns REDIS_URL.
   * @param {ReturnType<NewCliScenario>} scenario
   */
  function withResolvedKvAddon(scenario) {
    return scenario
      .withConfigFile(PROFILE)
      .withExperimentalFeaturesFile(ENABLED_FEATURES)
      .when({ method: 'GET', path: '/v2/summary' })
      .respond({ status: 200, body: SUMMARY })
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/addons/:addonId/env' })
      .respond({ status: 200, body: [{ name: 'REDIS_URL', value: redis.url }] });
  }

  describe('happy path', () => {
    it('sends the command to Redis and prints the reply (human format)', async () => {
      redis.setReply('PING', '+PONG\r\n');

      const result = await withResolvedKvAddon(newScenario())
        .thenRunCli(['kv', KV_NAME, 'PING'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.last.pathParams?.addonId, KV_ADDON_ID);
        });

      assert.strictEqual(result.stdout, 'PONG');
      assert.strictEqual(result.stderr, '');
      assert.deepStrictEqual(redis.received, [['PING']]);
    });

    it('forwards every positional argument as part of the Redis command', async () => {
      redis.setReply('SET', '+OK\r\n');

      const result = await withResolvedKvAddon(newScenario())
        .thenRunCli(['kv', KV_NAME, 'SET', 'k', 'v', 'EX', '120'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, 'OK');
      assert.strictEqual(result.stderr, '');
      assert.deepStrictEqual(redis.received, [['SET', 'k', 'v', 'EX', '120']]);
    });

    it('accepts -F as an alias for --format json', async () => {
      redis.setReply('GET foo', '$3\r\nbar\r\n');

      const result = await withResolvedKvAddon(newScenario())
        .thenRunCli(['kv', KV_NAME, 'GET', 'foo', '-F', 'json'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '"bar"');
      assert.strictEqual(result.stderr, '');
      assert.deepStrictEqual(redis.received, [['GET', 'foo']]);
    });
  });

  describe('arguments and options', () => {
    it('errors when the add-on argument is missing', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .thenRunCli(['kv'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /missing value/);
    });

    // --format schema is `z.enum(['human', 'json'])`.
    it('errors when --format is not in the allowed enum', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .thenRunCli(['kv', KV_NAME, 'PING', '--format', 'xml'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^format: Invalid option: expected one of "human"\|"json"/);
    });
  });

  describe('experimental feature gate', () => {
    it('does not expose the kv subcommand when the kv feature is not enabled', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      // With kv hidden, the CLI prints global help on stdout (no [ERROR]).
      assert.strictEqual(result.stderr, '');
      assert.doesNotMatch(result.stdout, /clever kv/);
    });
  });

  describe('add-on resolution', () => {
    it('errors when the add-on does not exist', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['kv', 'unknown-addon', 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Add-on unknown-addon not found');
    });

    it('errors when several add-ons match the given name (across orgs)', async () => {
      const ambiguousSummary = {
        user: { ...SELF, applications: [], addons: [], consumers: [] },
        organisations: [
          {
            id: ORGA_ID,
            name: 'orga-1',
            applications: [],
            addons: [{ id: KV_ADDON_ID, realId: KV_REAL_ID, name: KV_NAME, providerId: 'kv' }],
            consumers: [],
          },
          {
            id: 'orga_other',
            name: 'orga-2',
            applications: [],
            addons: [{ id: 'addon_other', realId: 'kv_other', name: KV_NAME, providerId: 'kv' }],
            consumers: [],
          },
        ],
      };

      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: ambiguousSummary })
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.match(result.stderr, /^\[ERROR\] Several add-ons found for/);
    });
  });

  describe('redis URL discovery', () => {
    it('errors when the add-on env vars do not include REDIS_URL', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: '/v2/organisations/:ownerId/addons/:addonId/env' })
        .respond({ status: 200, body: [{ name: 'OTHER', value: 'x' }] })
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] Environment variable REDIS_URL not found, is it a Materia KV or Redis® add-on?',
      );
    });
  });

  describe('Redis errors', () => {
    it('exits with an error when Redis returns an error reply', async () => {
      redis.setReply('GET', '-WRONGTYPE Operation against a key holding the wrong kind of value\r\n');

      const result = await withResolvedKvAddon(newScenario())
        .thenRunCli(['kv', KV_NAME, 'GET', 'aList'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] WRONGTYPE Operation against a key holding the wrong kind of value');
    });
  });

  describe('API errors', () => {
    it('reports the error body when /v2/summary returns a non-2xx status', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });

    it('reports the error body when the addon env endpoint returns a non-2xx status', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: '/v2/organisations/:ownerId/addons/:addonId/env' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/summary returns 401', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withExperimentalFeaturesFile(ENABLED_FEATURES)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['kv', KV_NAME, 'PING'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
