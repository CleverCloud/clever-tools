import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { NewCliScenario } from '../../../test/cli-hooks.ts';
import { cliHooks } from '../../../test/cli-hooks.ts';
import { rawApplication } from '../../../test/fixtures/application.ts';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.ts';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.ts';
import { SELF } from '../../../test/fixtures/self.ts';

const APP = rawApplication({ ownerId: SELF.id });

// The owner of the app ID is resolved from /v2/summary before fetching the app itself.
const SUMMARY = {
  user: {
    id: SELF.id,
    applications: [{ id: APP_ID, name: APP.name, variantSlug: 'node' }],
    addons: [],
    consumers: [],
  },
  organisations: [],
};

const APP_ENDPOINT = '/v2/organisations/:owner/applications/:app';

describe('link command', () => {
  const hooks = cliHooks();
  let newScenario: NewCliScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('links the repository by app ID and writes .clever.json', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: APP })
        .thenRunCli(['link', APP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.pathParams?.owner, SELF.id);
          assert.strictEqual(calls.last.pathParams?.app, APP_ID);
        })
        .verifyFiles((fsRead) => {
          assert.deepStrictEqual(fsRead.readAppConfigFile(), {
            apps: [
              {
                app_id: APP_ID,
                org_id: SELF.id,
                deploy_url: APP.deployment.httpUrl,
                git_ssh_url: APP.deployment.url,
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
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: APP_ENDPOINT })
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
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: APP })
        .thenRunCli(['link', APP_ID, '--org', ORGA_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.path, `/v2/organisations/${SELF.id}/applications/${APP_ID}`);
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
    it('errors when the app ID is not found in /v2/summary', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: { user: { id: SELF.id }, organisations: [] } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('reports the error body when GET /v2/organisations/:owner/applications/:app returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] [500]: oops');
    });

    it('reports the error body when GET /v2/summary returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['link', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] [500]: oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/summary returns 401', async () => {
      const result = await newScenario()
        .withAppFile('my-app.js', '')
        .when({ method: 'GET', path: '/v2/summary' })
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
