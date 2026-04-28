import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const CLEVER_APP_CONFIG_MULTI = {
  apps: [
    {
      app_id: APP_ID,
      org_id: ORGA_ID,
      deploy_url: `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      name: 'test-app (prod)',
      alias: 'prod',
    },
    {
      app_id: APP_ID,
      org_id: ORGA_ID,
      deploy_url: `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      name: 'test-app (staging)',
      alias: 'staging',
    },
  ],
};

describe('deploy command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should error when not in an app directory', async () => {
    const result = await newScenario()
      .thenRunCli(['deploy'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      '[ERROR] There is no linked or targeted application. Use `--app` option or `clever link` command.',
    );
  });

  it('should error when app config has multiple aliases and no --alias is given', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .thenRunCli(['deploy'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(
      result.stderr,
      '[ERROR] Several applications are linked. You can specify one with the "--alias" option. Run "clever applications" to list linked applications. Available aliases: prod, staging',
    );
  });

  it('should error when --alias does not match any linked application', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .thenRunCli(['deploy', '--alias', 'unknown'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
  });
});
