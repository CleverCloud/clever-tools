import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').CliTestKit} CliTestKit
 */

/** @type {Array<any>} */
const EMPTY_EMAIL_HOOKS = [];
const CLEVER_APP_CONFIG = {
  apps: [
    {
      app_id: 'app_xxx',
      org_id: 'orga_xxx',
      deploy_url: 'https://push-n3-par-clevercloud-customers.services.clever-cloud.com/app_xxx.git',
      name: 'test-app',
      alias: 'test-app',
    },
  ],
};
const CLEVER_APP_CONFIG_MULTI = {
  apps: [
    {
      app_id: 'app_xxx',
      org_id: 'orga_xxx',
      deploy_url: 'https://push-n3-par-clevercloud-customers.services.clever-cloud.com/app_xxx.git',
      name: 'test-app (prod)',
      alias: 'prod',
    },
    {
      app_id: 'app_xxx',
      org_id: 'orga_xxx',
      deploy_url: 'https://push-n3-par-clevercloud-customers.services.clever-cloud.com/app_xxx.git',
      name: 'test-app (staging)',
      alias: 'staging',
    },
  ],
};

describe('notify-email command', () => {
  const hooks = cliHooks();
  /** @type {CliTestKit} */
  let testKit;

  before(async () => {
    testKit = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should show error when not in an app directory', async () => {
    const result = await testKit
      .newScenario()
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
      .thenCall(() => testKit.runCli(['notify-email'], { expectExitCode: 1 }))
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      '[ERROR] There is no linked or targeted application. Use `--app` option or `clever link` command.',
    );
  });

  it('should show error when app config has multiple aliases', async () => {
    const result = await testKit
      .newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
      .thenCall(() => testKit.runCli(['notify-email'], { expectExitCode: 1 }))
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      '[ERROR] Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: prod, staging',
    );
  });

  it('should show empty string when no email hooks', async () => {
    const result = await testKit
      .newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
      .thenCall(() => testKit.runCli(['notify-email']))
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, 'orga_xxx');
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '');
  });

  it('should show email hooks', async () => {
    // todo. implement this test (and maybe create other tests) to cover all implementation paths
  });
});
