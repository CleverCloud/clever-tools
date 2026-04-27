import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
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
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should show the logs emitted by the SSE', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v4/logs/organisations/:ownerId/applications/:appId/logs' })
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
          { type: 'message', event: 'END_OF_STREAM', data: JSON.stringify({ endedBy: 'limit' }) },
          { type: 'close' },
        ],
        delayBetween: 10,
      })
      .thenRunCli(['logs'])
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, 'orga_xxx');
        assert.strictEqual(calls.first.pathParams?.appId, 'app_xxx');
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
});
