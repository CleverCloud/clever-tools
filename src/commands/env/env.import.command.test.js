import dedent from 'dedent';
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

describe('env import command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should replace all env vars from name=value lines on stdin', async () => {
    const stdin = dedent`
      FOO=bar
      BAZ="qux quux"
    `;

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'PUT', path: '/v2/organisations/:ownerId/applications/:appId/env' })
      .respond({ status: 200, body: {} })
      .thenRunCli(['env', 'import'], { stdin })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.method, 'PUT');
        assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
        assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        assert.deepStrictEqual(calls.first.body, { FOO: 'bar', BAZ: 'qux quux' });
      });

    assert.strictEqual(result.stdout, 'Environment variables have been set');
    assert.strictEqual(result.stderr, '');
  });

  it('should replace all env vars from JSON on stdin when --json is given', async () => {
    const stdin = JSON.stringify([
      { name: 'FOO', value: 'bar' },
      { name: 'BAZ', value: 'qux quux' },
    ]);

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'PUT', path: '/v2/organisations/:ownerId/applications/:appId/env' })
      .respond({ status: 200, body: {} })
      .thenRunCli(['env', 'import', '--json'], { stdin })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.deepStrictEqual(calls.first.body, { FOO: 'bar', BAZ: 'qux quux' });
      });

    assert.strictEqual(result.stdout, 'Environment variables have been set');
    assert.strictEqual(result.stderr, '');
  });

  it('should error and not call the API when name=value input is malformed', async () => {
    const stdin = dedent`
      FOO=1
      FOO=2
    `;

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .thenRunCli(['env', 'import'], { stdin, expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] line 2: be careful, the name FOO is already defined');
  });

  it('should error and not call the API when --json input is not valid JSON', async () => {
    const stdin = 'not json';

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .thenRunCli(['env', 'import', '--json'], { stdin, expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      `[ERROR] Error when parsing JSON input: Unexpected token 'o', "not json" is not valid JSON`,
    );
  });
});
