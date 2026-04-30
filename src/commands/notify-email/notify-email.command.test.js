import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { ORGA_ID } from '../../../test/fixtures/id.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
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

const EMAIL_HOOKS = [
  {
    id: 'notif_1',
    name: 'App hook',
    ownerId: 'orga_xxx',
    scope: ['app_xxx'],
    events: ['DEPLOYMENT_SUCCESS', 'DEPLOYMENT_FAIL'],
    notified: [{ target: 'alice@example.com' }, { target: null }],
  },
  {
    id: 'notif_2',
    ownerId: 'orga_xxx',
  },
  {
    id: 'notif_3',
    name: 'Other app',
    ownerId: 'orga_xxx',
    scope: ['app_other'],
    events: ['DEPLOYMENT_SUCCESS'],
    notified: [{ target: 'dave@example.com' }],
  },
];

const FORMATTED_SCOPED_HOOKS = [
  {
    id: 'notif_1',
    name: 'App hook',
    ownerId: 'orga_xxx',
    services: ['app_xxx'],
    events: ['DEPLOYMENT_SUCCESS', 'DEPLOYMENT_FAIL'],
    notified: ['alice@example.com', 'whole team'],
  },
  {
    id: 'notif_2',
    ownerId: 'orga_xxx',
    services: ['orga_xxx'],
    events: ['ALL'],
    notified: ['whole team'],
  },
];

const FORMATTED_ALL_HOOKS = [
  ...FORMATTED_SCOPED_HOOKS,
  {
    id: 'notif_3',
    name: 'Other app',
    ownerId: 'orga_xxx',
    services: ['app_other'],
    events: ['DEPLOYMENT_SUCCESS'],
    notified: ['dave@example.com'],
  },
];

const HUMAN_SCOPED_OUTPUT = dedent`
  App hook
    id: notif_1
    services: app_xxx
    events: DEPLOYMENT_SUCCESS, DEPLOYMENT_FAIL
    to:
      alice@example.com
      whole team
  notif_2
    id: notif_2
    services: orga_xxx
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

const SUMMARY = {
  user: { id: SELF.id },
  organisations: [{ id: ORGA_ID, name: 'my-org' }],
};

describe('notify-email command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should show error when not in an app directory', async () => {
    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
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

  it('should show error when app config has multiple aliases', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
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

  it('should show empty string when no email hooks', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/notifications/emailhooks/:ownerId' })
      .respond({ status: 200, body: EMPTY_EMAIL_HOOKS })
      .thenRunCli(['notify-email'])
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, 'orga_xxx');
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '');
  });
});
