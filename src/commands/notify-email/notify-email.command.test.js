import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

/** @type {Array<any>} */
const EMPTY_EMAIL_HOOKS = [];

// Note: the linked-app fixture sets `org_id` to ORGA_ID and `app_id` to APP_ID; mock hooks below
// are keyed against ORGA_ID/APP_ID so the scoping logic in the handler matches them.
const EMAIL_HOOKS = [
  {
    id: 'notif_1',
    name: 'App hook',
    ownerId: ORGA_ID,
    scope: [APP_ID],
    events: ['DEPLOYMENT_SUCCESS', 'DEPLOYMENT_FAIL'],
    notified: [{ target: 'alice@example.com' }, { target: null }],
  },
  {
    id: 'notif_2',
    ownerId: ORGA_ID,
  },
  {
    id: 'notif_3',
    name: 'Other app',
    ownerId: ORGA_ID,
    scope: ['app_other'],
    events: ['DEPLOYMENT_SUCCESS'],
    notified: [{ target: 'dave@example.com' }],
  },
];

const FORMATTED_SCOPED_HOOKS = [
  {
    id: 'notif_1',
    name: 'App hook',
    ownerId: ORGA_ID,
    services: [APP_ID],
    events: ['DEPLOYMENT_SUCCESS', 'DEPLOYMENT_FAIL'],
    notified: ['alice@example.com', 'whole team'],
  },
  {
    id: 'notif_2',
    ownerId: ORGA_ID,
    services: [ORGA_ID],
    events: ['ALL'],
    notified: ['whole team'],
  },
];

const FORMATTED_ALL_HOOKS = [
  ...FORMATTED_SCOPED_HOOKS,
  {
    id: 'notif_3',
    name: 'Other app',
    ownerId: ORGA_ID,
    services: ['app_other'],
    events: ['DEPLOYMENT_SUCCESS'],
    notified: ['dave@example.com'],
  },
];

const HUMAN_SCOPED_OUTPUT = dedent`
  App hook
    id: notif_1
    services: ${APP_ID}
    events: DEPLOYMENT_SUCCESS, DEPLOYMENT_FAIL
    to:
      alice@example.com
      whole team
  notif_2
    id: notif_2
    services: ${ORGA_ID}
    events: ALL
    to: whole team
`;

const HUMAN_ALL_OUTPUT =
  HUMAN_SCOPED_OUTPUT +
  '\n' +
  dedent`
    Other app
      id: notif_3
      services: app_other
      events: DEPLOYMENT_SUCCESS
      to: dave@example.com
  `;

const SUMMARY_FOR_ORG_NAME = {
  user: { id: SELF.id },
  organisations: [{ id: ORGA_ID, name: 'my-org' }],
};

const EMAILHOOKS_ENDPOINT = '/v2/notifications/emailhooks/:ownerId';

describe('notify-email command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('prints scoped hooks for the linked app (default)', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMAIL_HOOKS })
        .thenRunCli(['notify-email'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
        });

      assert.strictEqual(result.stdout, HUMAN_SCOPED_OUTPUT.trim());
      assert.strictEqual(result.stderr, '');
    });

    it('prints an empty string when there are no email hooks', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
        .thenRunCli(['notify-email'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '');
    });

    it('shows all hooks (across apps) when --list-all is set (uses current user, not linked app)', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: { ...SELF, id: ORGA_ID } })
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMAIL_HOOKS })
        .thenRunCli(['notify-email', '--list-all'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
        });

      assert.strictEqual(result.stdout, HUMAN_ALL_OUTPUT.trim());
      assert.strictEqual(result.stderr, '');
    });

    it('prints JSON when --format json is given', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMAIL_HOOKS })
        .thenRunCli(['notify-email', '--format', 'json'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.deepStrictEqual(JSON.parse(result.stdout), FORMATTED_SCOPED_HOOKS);
    });

    it('prints all hooks as JSON when --list-all --format json are combined', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: '/v2/self' })
        .respond({ status: 200, body: { ...SELF, id: ORGA_ID } })
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMAIL_HOOKS })
        .thenRunCli(['notify-email', '--list-all', '--format', 'json'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.deepStrictEqual(JSON.parse(result.stdout), FORMATTED_ALL_HOOKS);
    });

    it('resolves owner from --org name via /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY_FOR_ORG_NAME })
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
        .thenRunCli(['notify-email', '--org', 'my-org'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('arguments and options', () => {
    // --format schema is `z.enum(['human', 'json'])`.
    it('errors when --format is not in the allowed enum', async () => {
      const result = await newScenario()
        .thenRunCli(['notify-email', '--format', 'xml'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^format: Invalid option: expected one of "human"\|"json"/);
    });
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory and --org/--list-all are not set', async () => {
      const result = await newScenario()
        .thenRunCli(['notify-email'], { expectExitCode: 1 })
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
        .thenRunCli(['notify-email'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: prod, staging',
      );
    });

    it('errors when --org does not match any known organisation', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY_FOR_ORG_NAME })
        .thenRunCli(['notify-email', '--org', 'unknown-org'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Organisation not found');
    });
  });

  describe('API errors', () => {
    it('reports the error body when /v2/notifications/emailhooks/:ownerId returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['notify-email'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the API returns 401', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: EMAILHOOKS_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['notify-email'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
