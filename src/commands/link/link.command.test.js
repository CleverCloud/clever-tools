import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const APP = {
  id: APP_ID,
  ownerId: SELF.id,
  name: 'test-app',
  deployment: {
    httpUrl: `https://push-n2-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
  },
};

describe('link command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('links the repository by app ID and writes .clever.json', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/applications/:app' })
        .respond({ status: 200, body: APP })
        .thenRunCli(['link', APP_ID])
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
                deploy_url: APP.deployment.httpUrl,
                name: APP.name,
                alias: APP.name,
              },
            ],
          });
        });

      assert.strictEqual(
        result.stdout,
        `✓ Application ${APP_ID} has been successfully linked to local alias ${APP.name}!`,
      );
      assert.strictEqual(result.stderr, '');
    });

    it('links with a custom --alias', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/applications/:app' })
        .respond({ status: 200, body: APP })
        .thenRunCli(['link', APP_ID, '--alias', 'prod'])
        .verifyFiles((fsRead) => {
          assert.strictEqual(fsRead.readAppConfigFile().apps[0].alias, 'prod');
        });

      assert.strictEqual(result.stdout, `✓ Application ${APP_ID} has been successfully linked to local alias prod!`);
      assert.strictEqual(result.stderr, '');
    });

    it('warns and ignores --org when an app ID is given', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/applications/:app' })
        .respond({ status: 200, body: APP })
        .thenRunCli(['link', APP_ID, '--org', ORGA_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.path, `/v2/self/applications/${APP_ID}`);
        });

      assert.match(result.stdout, /unique application ID, organisation option will be ignored/);
    });
  });

  describe('arguments and options', () => {
    it('errors when no application argument is given', async () => {
      const result = await newScenario()
        .thenRunCli(['link'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^app-id\|app-name: missing value/);
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('API errors', () => {
    it('reports the error body when GET /v2/self/applications/:app returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: SELF })
        .when({ method: 'GET', path: '/v2/self/applications/:app' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    it('reports the error body when GET /v2/self returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/self returns 401', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
