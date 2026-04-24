import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').CliTestKit} CliTestKit
 */

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

describe('logs command', () => {
  const hooks = cliHooks();
  /** @type {CliTestKit} */
  let testKit;

  before(async () => {
    testKit = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should show the logs', async () => {
    const result = await testKit
      .newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v4/logs/organisations/:ownerId/applications/:appId/logs' })
      .respond({
        status: 200,
        events: [
          { type: 'message', event: 'APPLICATION_LOG', data: JSON.stringify({ id: '1', message: 'log message 1' }) },
          { type: 'message', event: 'APPLICATION_LOG', data: JSON.stringify({ id: '2', message: 'log message 2' }) },
          { type: 'close' },
        ],
        delayBetween: 10,
      })
      .thenCall(() => testKit.runCli(['logs']))
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, 'orga_xxx');
        assert.strictEqual(calls.first.pathParams?.appId, 'app_xxx');
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '');
  });
});
