import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { NewCliScenario } from '../../../test/cli-hooks.ts';
import { cliHooks } from '../../../test/cli-hooks.ts';
import { singleAppConfig } from '../../../test/fixtures/app-config.ts';
import { APP_ID, ORGA_ID, USER_ID } from '../../../test/fixtures/id.ts';

const EMAILHOOKS_ENDPOINT = '/v2/notifications/emailhooks/:ownerId';

const CREATED_HOOK = {
  id: 'notif_1',
  ownerId: ORGA_ID,
  name: 'my hook',
  notified: [{ type: 'email', target: 'alice@example.com' }],
  events: ['DEPLOYMENT_FAIL'],
  scope: [APP_ID],
  createdAt: '2026-07-09T00:00:00.000Z',
};

describe('notify-email add command', () => {
  const hooks = cliHooks();
  let newScenario: NewCliScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('creates a hook scoped to the linked app and maps every target kind', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'POST', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: CREATED_HOOK })
        .thenRunCli(['notify-email', 'add', 'my hook', '--notify', `alice@example.com,${USER_ID},organisation`])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.deepStrictEqual(calls.first.body, {
            name: 'my hook',
            notified: [
              { type: 'email', target: 'alice@example.com' },
              { type: 'userid', target: USER_ID },
              { type: 'organisation' },
            ],
            events: null,
            scope: [APP_ID],
          });
        });

      assert.strictEqual(result.stdout, 'The webhook has been added');
      assert.strictEqual(result.stderr, '');
    });

    it('creates one email entry per comma-separated address', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'POST', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: CREATED_HOOK })
        .thenRunCli(['notify-email', 'add', 'my hook', '--notify', 'alice@example.com,bob@example.com'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.deepStrictEqual(calls.first.body, {
            name: 'my hook',
            notified: [
              { type: 'email', target: 'alice@example.com' },
              { type: 'email', target: 'bob@example.com' },
            ],
            events: null,
            scope: [APP_ID],
          });
        });

      assert.strictEqual(result.stdout, 'The webhook has been added');
      assert.strictEqual(result.stderr, '');
    });

    it('passes events and drops unrecognized notify values', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'POST', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: CREATED_HOOK })
        .thenRunCli([
          'notify-email',
          'add',
          'my hook',
          '--notify',
          'alice@example.com,not-a-target',
          '--event',
          'DEPLOYMENT_FAIL,DEPLOYMENT_SUCCESS',
        ])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.deepStrictEqual(calls.first.body, {
            name: 'my hook',
            notified: [{ type: 'email', target: 'alice@example.com' }],
            events: ['DEPLOYMENT_FAIL', 'DEPLOYMENT_SUCCESS'],
            scope: [APP_ID],
          });
        });

      assert.strictEqual(result.stdout, 'The webhook has been added');
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('arguments and options', () => {
    it('errors when --service is used without --org', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .thenRunCli(['notify-email', 'add', 'my hook', '--notify', 'alice@example.com', '--service', APP_ID], {
          expectExitCode: 1,
        })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] --org is required when using --service');
    });
  });

  describe('API errors', () => {
    it('reports the error body when the API returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'POST', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['notify-email', 'add', 'my hook', '--notify', 'alice@example.com'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] [500]: oops');
    });
  });
});
