import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { startMockGitHttpServer } from '../../../test/fixtures/git-http-server-cgi.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 * @typedef {import('../../../test/fixtures/git-http-server.js').MockGitHttpServer} MockGitHttpServer
 */

const PROFILE = {
  version: 1,
  profiles: [
    {
      alias: 'default',
      token: 'profile-token',
      secret: 'profile-secret',
      userId: SELF.id,
      email: SELF.email,
    },
  ],
};

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

describe('deploy command — real push', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {MockGitHttpServer} */
  let gitServer;

  before(async () => {
    newScenario = await hooks.before();
    gitServer = await startMockGitHttpServer();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    gitServer.reset();
  });

  after(async () => {
    await gitServer.close();
    await hooks.after();
  });

  /**
   * App config tied to the running mock git server, since `deploy_url` must
   * resolve to a repo we control.
   * @returns {{ apps: Array<object> }}
   */
  function appConfigFor(appId = APP_ID) {
    return {
      apps: [
        {
          app_id: appId,
          org_id: ORGA_ID,
          deploy_url: gitServer.getRepoUrl(appId),
          name: 'test-app',
          alias: 'test-app',
        },
      ],
    };
  }

  /**
   * Minimum app body that survives `addInstanceLifetime` (which dereferences `instance.lifetime`).
   * @param {{ commitId?: string | null }} overrides
   */
  function appBody({ commitId = null } = {}) {
    return {
      id: APP_ID,
      ownerId: ORGA_ID,
      name: 'test-app',
      commitId,
      instance: { lifetime: 'REGULAR' },
    };
  }

  it('should push a new commit and exit at deploy-start', async () => {
    gitServer.addRepo(APP_ID);

    let headCommit = '';
    const result = await newScenario()
      .withConfigFile(PROFILE)
      .withAppConfigFile(appConfigFor())
      .withAppGitRepo({}, (seed) => {
        headCommit = seed.headCommit;
      })
      .when({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}` })
      .respond({ status: 200, body: appBody() })
      .when({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}/deployments` })
      .respond([
        { status: 200, body: [] },
        { status: 200, body: [{ uuid: 'deploy_new', commit: headCommit, state: 'WIP' }] },
      ])
      .thenRunCli(['deploy', '--exit-on', 'deploy-start'])
      .verify((calls) => {
        assert.strictEqual(
          calls.filter({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}` }).count,
          1,
        );
        assert.ok(
          calls.filter({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}/deployments` })
            .count >= 2,
        );
      });

    assert.strictEqual(result.exitCode, 0);
    assert.match(result.stdout, /🚀 Deploying/);
    assert.match(result.stdout, new RegExp(`Local commit\\s+${headCommit}`));
    assert.match(result.stdout, /✓ Code pushed to Clever Cloud/);
    assert.match(result.stdout, /✓ Deployment started/);
  });

  it('should print up-to-date and skip the push when same-commit-policy is ignore', async () => {
    let headCommit = '';
    const result = await newScenario()
      .withConfigFile(PROFILE)
      .withAppConfigFile(appConfigFor())
      .withAppGitRepo({}, (seed) => {
        headCommit = seed.headCommit;
        // Seed the bare repo from the local repo so info/refs returns the same SHA.
        gitServer.addRepo(APP_ID, { fromLocalRepo: seed.dir });
      })
      .when({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}` })
      .respond({ status: 200, body: appBody({ commitId: headCommit }) })
      .thenRunCli(['deploy', '--same-commit-policy', 'ignore'])
      .verify((calls) => {
        assert.strictEqual(
          calls.filter({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}/deployments` })
            .count,
          0,
        );
      });

    assert.strictEqual(result.exitCode, 0);
    assert.match(result.stdout, /up-to-date/);
  });

  it('should report brand-new app and push when remote has no commits', async () => {
    gitServer.addRepo(APP_ID);

    let headCommit = '';
    const result = await newScenario()
      .withConfigFile(PROFILE)
      .withAppConfigFile(appConfigFor())
      .withAppGitRepo({}, (seed) => {
        headCommit = seed.headCommit;
      })
      .when({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}` })
      .respond({ status: 200, body: appBody() })
      .when({ method: 'GET', path: `/v2/organisations/${ORGA_ID}/applications/${APP_ID}/deployments` })
      .respond([
        { status: 200, body: [] },
        { status: 200, body: [{ uuid: 'deploy_new', commit: headCommit, state: 'WIP' }] },
      ])
      .thenRunCli(['deploy', '--exit-on', 'deploy-start']);

    assert.strictEqual(result.exitCode, 0);
    assert.match(result.stdout, /App is brand new, no commits on remote yet/);
    assert.match(result.stdout, /✓ Deployment started/);
  });
});
