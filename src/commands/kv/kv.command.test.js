import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { ORGA_ID, UUID } from '../../../test/fixtures/id.js';
import { startMockRedis } from '../../../test/fixtures/redis-server.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 * @typedef {import('../../../test/fixtures/redis-server.js').MockRedisServer} MockRedisServer
 */

const TOKEN = 'profile-token';
const SECRET = 'profile-secret';
const PROFILE = {
  version: 1,
  profiles: [
    {
      alias: 'default',
      token: TOKEN,
      secret: SECRET,
      userId: SELF.id,
      email: SELF.email,
    },
  ],
};

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
      addons: [
        {
          id: KV_ADDON_ID,
          realId: KV_REAL_ID,
          name: KV_NAME,
          providerId: 'kv',
        },
      ],
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
   * the summary lookup and the addon env-vars lookup that returns REDIS_URL.
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

  it('should send the command to Redis and print the reply (human format)', async () => {
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

  it('should forward every positional argument as part of the Redis command', async () => {
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

  it('should JSON-encode the reply when --format json is given', async () => {
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

  it('should exit with an error when Redis returns an error reply', async () => {
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
