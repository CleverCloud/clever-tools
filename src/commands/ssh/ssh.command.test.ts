import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { NewCliScenario } from '../../../test/cli-hooks.ts';
import { cliHooks } from '../../../test/cli-hooks.ts';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.ts';
import { APP_ALIAS_MUTEX_ERROR, NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.ts';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.ts';
import { idsCache } from '../../../test/fixtures/ids-cache.ts';
import { SELF } from '../../../test/fixtures/self.ts';
import { keys } from '../../../test/keys.ts';

const INSTANCES_ENDPOINT = '/v2/organisations/:ownerId/applications/:appId/instances';

const APP_NAME = 'test-app';
const UNKNOWN_APP_ID = 'app_99999999-9999-4999-8999-999999999999';

const SUMMARY = {
  user: { ...SELF, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [{ id: APP_ID, name: APP_NAME, variantSlug: 'node' }],
      addons: [],
      consumers: [],
    },
  ],
};

const APP_IDS_CACHE = idsCache({ owners: { [APP_ID]: ORGA_ID } });

const NO_INSTANCES_ERROR = '[ERROR] No running instances found for this application';

describe('ssh command', () => {
  // Note: the marker-protocol / stdin-escape / streaming behaviour of `clever ssh --command`
  // is covered in ssh.marker-protocol.test.ts as in-process unit tests. The tests in this file
  // exercise the command's pre-spawn path: app resolution, instance picking, error handling.

  const hooks = cliHooks();
  let newScenario: NewCliScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  after(async () => {
    await hooks.after();
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory and --app is missing', async () => {
      const result = await newScenario()
        .thenRunCli(['ssh'], { expectExitCode: 1 })
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
        .thenRunCli(['ssh'], { expectExitCode: 1 })
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
        .thenRunCli(['ssh', '--alias', 'unknown'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
    });

    it('errors when both --app and --alias are provided', async () => {
      const result = await newScenario()
        .thenRunCli(['ssh', '--app', APP_ID, '--alias', 'test-app'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, APP_ALIAS_MUTEX_ERROR);
    });
  });

  describe('app ID resolution', () => {
    function withEmptyInstances(scenario: ReturnType<NewCliScenario>) {
      return scenario.when({ method: 'GET', path: INSTANCES_ENDPOINT }).respond({ status: 200, body: [] });
    }

    // === app ID (app_<UUID>) ===

    it('resolves an app ID from cache without calling /v2/summary', async () => {
      const result = await withEmptyInstances(newScenario().withIdsCacheFile(APP_IDS_CACHE))
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('resolves an app ID via /v2/summary when cache is empty', async () => {
      const result = await withEmptyInstances(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('errors when an app ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['ssh', '--app', UNKNOWN_APP_ID], { expectExitCode: 1 })
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
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === app name — goes directly to /v2/summary (no cache lookup) ===

    it('resolves an app name via /v2/summary', async () => {
      const result = await withEmptyInstances(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['ssh', '--app', APP_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('errors when an app name is not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['ssh', '--app', 'unknown-app'], { expectExitCode: 1 })
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
        .thenRunCli(['ssh', '--app', APP_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });
  });

  describe('instance selection', () => {
    it('errors when the application has no running instances', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: [] })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] No running instances found for this application');
    });

    it('errors when multiple instances are running and stdout is not a TTY', async () => {
      const instances = [
        { id: 'instance_1', displayName: 'Instance one', instanceNumber: 0, state: 'UP' },
        { id: 'instance_2', displayName: 'Instance two', instanceNumber: 1, state: 'UP' },
      ];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] Multiple instances are running. Cannot select in non-interactive mode.',
      );
    });

    it('drives the select prompt and picks an instance when multiple are running (PTY)', async () => {
      // Pass instances out of order to also verify the sort-by-instanceNumber.
      const instances = [
        { id: 'instance_2', displayName: 'Instance two', instanceNumber: 2, state: 'UP' },
        { id: 'instance_0', displayName: 'Instance zero', instanceNumber: 0, state: 'UP' },
        { id: 'instance_1', displayName: 'Instance one', instanceNumber: 1, state: 'UP' },
      ];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh'], {
          pty: true,
          interactions: [{ waitFor: /Select an instance/, send: keys.DOWN + keys.ENTER }],
          // Point ssh at an unresolvable host so it fails fast instead of dialing the real gateway.
          env: { SSH_GATEWAY: 'ssh@unreachable.invalid' },
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      // segments[0]: choices appear sorted by instanceNumber, cursor on the first.
      assert.match(
        result.segments[0],
        /Select an instance:[\s\S]*❯ Instance zero - Instance 0 - UP \(instance_0\)[\s\S]*Instance one - Instance 1 - UP \(instance_1\)[\s\S]*Instance two - Instance 2 - UP \(instance_2\)/,
      );

      // segments[1]: after DOWN + ENTER, the confirmation line shows the chosen value.
      assert.match(result.segments[1], /✔ Select an instance: Instance one - Instance 1 - UP \(instance_1\)/);
    });
  });

  describe('API errors', () => {
    it('reports the error body when the instances endpoint returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the instances endpoint returns 401', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
