import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const CLEVER_APP_CONFIG = {
  apps: [
    {
      app_id: APP_ID,
      org_id: ORGA_ID,
      deploy_url: `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      name: 'test-app',
      alias: 'test-app',
    },
  ],
};

const CLEVER_APP_CONFIG_MULTI = {
  apps: [
    {
      app_id: APP_ID,
      org_id: ORGA_ID,
      deploy_url: `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      name: 'test-app (prod)',
      alias: 'prod',
    },
    {
      app_id: APP_ID,
      org_id: ORGA_ID,
      deploy_url: `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      name: 'test-app (staging)',
      alias: 'staging',
    },
  ],
};

describe('ssh command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should error when both --app and --alias are provided', async () => {
    const result = await newScenario()
      .thenRunCli(['ssh', '--app', APP_ID, '--alias', 'test-app'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      '[ERROR] Only one of the `--app` or `--alias` options can be set at a time',
    );
  });

  it('should error when not in an app directory and --app is missing', async () => {
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

  it('should error when app config has multiple aliases and no --alias is given', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
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

  it('should error when --alias does not match any linked application', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .thenRunCli(['ssh', '--alias', 'unknown'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.match(result.stderr, /^\[ERROR\] /);
  });

  it('should error when the application has no running instances', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
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

  it('should error when multiple instances are running and stdout is not a TTY', async () => {
    const instances = [
      { id: 'instance_1', displayName: 'Instance one', instanceNumber: 0, state: 'UP' },
      { id: 'instance_2', displayName: 'Instance two', instanceNumber: 1, state: 'UP' },
    ];

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
      .respond({ status: 200, body: instances })
      .thenRunCli(['ssh'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
        assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Multiple instances are running. Cannot select in non-interactive mode.');
  });
});
