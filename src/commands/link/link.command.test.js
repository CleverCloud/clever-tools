import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { APP_ID } from '../../../test/fixtures/id.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').CliTestKit} CliTestKit
 */

describe('link command', () => {
  const hooks = cliHooks();
  /** @type {CliTestKit} */
  let testKit;

  before(async () => {
    testKit = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should link', async () => {
    const app = {
      id: APP_ID,
      ownerId: SELF.id,
      name: 'test-app',
      deployment: {
        httpUrl: `https://push-n2-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      },
    };

    const result = await testKit
      .newScenario()
      .withAppFile('my-app.js', '')
      .when({ method: 'GET', path: '/v2/self' })
      .respond({ status: 200, body: SELF })
      .when({ method: 'GET', path: '/v2/self/applications/:app' })
      .respond({ status: 200, body: app })
      .thenCall(() => testKit.runCli(['link', APP_ID]))
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
        assert.strictEqual(calls.last.pathParams?.app, APP_ID);
      })
      .verifyFiles((fsRead) => {
        assert.deepStrictEqual(fsRead.readAppConfigFile(), {
          apps: [
            {
              app_id: APP_ID,
              org_id: SELF.id,
              deploy_url: app.deployment.httpUrl,
              name: app.name,
              alias: app.name,
            },
          ],
        });
      });

    assert.strictEqual(
      result.stdout,
      `✓ Application ${APP_ID} has been successfully linked to local alias ${app.name}!`,
    );
    assert.strictEqual(result.stderr, '');
  });
});
