import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { NewCliScenario } from '../../../test/cli-hooks.ts';
import { cliHooks } from '../../../test/cli-hooks.ts';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.ts';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.ts';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.ts';
import { profileConfig } from '../../../test/fixtures/profile.ts';

const PROFILE = profileConfig();

const APP_ENDPOINT = `/v2/organisations/${ORGA_ID}/applications/${APP_ID}`;
const DEPLOYMENTS_ENDPOINT = `${APP_ENDPOINT}/deployments`;

/**
 * Minimum app body that survives `addInstanceLifetime` (which dereferences `instance.lifetime`).
 */
function appBody({ commitId = null }: { commitId?: string | null } = {}) {
  return {
    id: APP_ID,
    ownerId: ORGA_ID,
    name: 'test-app',
    commitId,
    instance: { lifetime: 'REGULAR' },
  };
}

describe('deploy command', () => {
  const hooks = cliHooks({ enableGit: true });
  let newScenario: NewCliScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  after(async () => {
    await hooks.after();
  });

  /**
   * App config tied to the running mock git server, since `deploy_url` must
   * resolve to a repo we control.
   */
  function appConfig() {
    return singleAppConfig({ app_id: APP_ID, deploy_url: newScenario.gitClient.getRepoUrl(APP_ID) });
  }

  describe('happy path', () => {
    it('pushes a new commit and exits at deploy-start', async () => {
      let headCommit;
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppFile('README.md', 'Hello, world!')
        .withAppGit(APP_ID, (repo) => {
          headCommit = repo.commitAll();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: appBody() })
        .when({ method: 'GET', path: DEPLOYMENTS_ENDPOINT })
        .respond([
          { status: 200, body: [] },
          { status: 200, body: [{ uuid: 'deploy_new', commit: headCommit, state: 'WIP' }] },
        ])
        .thenRunCli(['deploy', '--exit-on', 'deploy-start'])
        .verify((calls) => {
          assert.strictEqual(calls.filter({ method: 'GET', path: APP_ENDPOINT }).count, 1);
          assert.ok(calls.filter({ method: 'GET', path: DEPLOYMENTS_ENDPOINT }).count >= 2);
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(
        result.stdout.replace(/\(\d+\.\d+s\)/, '(<duration>)'),
        dedent`
          🚀 Deploying test-app
             Application ID  ${APP_ID}
             Organisation ID ${ORGA_ID}

          🔀 Git information
             ! App is brand new, no commits on remote yet
             Local commit    ${headCommit} [will be deployed]

          🔄 Deployment progress
             → Pushing source code to Clever Cloud…
             ✓ Code pushed to Clever Cloud (<duration>)
             → Waiting for deployment to start…
             ✓ Deployment started (deploy_new)
        `,
      );
    });

    it('reports brand-new app and pushes when remote has no commits', async () => {
      let headCommit = '';
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppFile('README.md', 'Hello, world!')
        .withAppGit(APP_ID, (client) => {
          headCommit = client.commitAll();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: appBody() })
        .when({ method: 'GET', path: DEPLOYMENTS_ENDPOINT })
        .respond([
          { status: 200, body: [] },
          { status: 200, body: [{ uuid: 'deploy_new', commit: headCommit, state: 'WIP' }] },
        ])
        .thenRunCli(['deploy', '--exit-on', 'deploy-start']);

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(
        result.stdout.replace(/\(\d+\.\d+s\)/, '(<duration>)'),
        dedent`
          🚀 Deploying test-app
             Application ID  ${APP_ID}
             Organisation ID ${ORGA_ID}

          🔀 Git information
             ! App is brand new, no commits on remote yet
             Local commit    ${headCommit} [will be deployed]

          🔄 Deployment progress
             → Pushing source code to Clever Cloud…
             ✓ Code pushed to Clever Cloud (<duration>)
             → Waiting for deployment to start…
             ✓ Deployment started (deploy_new)
        `,
      );
    });
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory', async () => {
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

    it('errors when app config has multiple aliases and no --alias is given', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
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

    it('errors when --alias does not match any linked application', async () => {
      const result = await newScenario()
        .withAppConfigFile(multiAppConfig())
        .thenRunCli(['deploy', '--alias', 'unknown'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
    });
  });

  describe('arguments and options', () => {
    it('errors when --tag points to a tag that does not exist locally', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppGit(APP_ID)
        .thenRunCli(['deploy', '--tag', 'v-missing'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stderr, "[ERROR] Tag v-missing doesn't exist locally");
    });

    // --same-commit-policy schema is `z.enum(['error', 'ignore', 'restart', 'rebuild'])`.
    it('errors when --same-commit-policy is not in the allowed enum', async () => {
      const result = await newScenario()
        .thenRunCli(['deploy', '--same-commit-policy', 'invalid'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(
        result.stdout,
        /^same-commit-policy: Invalid option: expected one of "error"\|"ignore"\|"restart"\|"rebuild"/,
      );
    });

    // --exit-on schema is `z.enum(['deploy-start', 'deploy-end', 'never'])`.
    it('errors when --exit-on is not in the allowed enum', async () => {
      const result = await newScenario()
        .thenRunCli(['deploy', '--exit-on', 'invalid'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /^exit-on: Invalid option: expected one of "deploy-start"\|"deploy-end"\|"never"/);
    });
  });

  describe('same-commit policy', () => {
    it('prints up-to-date and skips the push when --same-commit-policy ignore is given', async () => {
      let headCommit = '';
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppFile('README.md', 'Hello, world!\n')
        .withAppGit(APP_ID, (repo) => {
          headCommit = repo.commitAll();
          repo.push();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: appBody({ commitId: headCommit }) })
        .thenRunCli(['deploy', '--same-commit-policy', 'ignore'])
        .verify((calls) => {
          assert.strictEqual(calls.filter({ method: 'GET', path: DEPLOYMENTS_ENDPOINT }).count, 0);
        });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, `✓ The application is up-to-date (${headCommit})`);
    });

    it('errors by default when local commit equals the remote head', async () => {
      let headCommit = '';
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppFile('README.md', 'Hello, world!\n')
        .withAppGit(APP_ID, (repo) => {
          headCommit = repo.commitAll();
          repo.push();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 200, body: appBody({ commitId: headCommit }) })
        .thenRunCli(['deploy'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.filter({ method: 'GET', path: DEPLOYMENTS_ENDPOINT }).count, 0);
        });

      assert.match(result.stderr, /Remote HEAD has the same commit as the one to push/);
    });
  });

  describe('API errors', () => {
    it('reports the error body when GET /v2/organisations/:ownerId/applications/:appId returns a non-2xx status', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppGit(APP_ID, (repo) => {
          repo.commitAll();
          repo.push();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['deploy'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.filter({ method: 'GET', path: APP_ENDPOINT }).count, 1);
        });

      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when /v2/organisations/:ownerId/applications/:appId returns 401', async () => {
      const result = await newScenario()
        .withConfigFile(PROFILE)
        .withAppConfigFile(appConfig())
        .withAppGit(APP_ID, (repo) => {
          repo.commitAll();
          repo.push();
        })
        .when({ method: 'GET', path: APP_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['deploy'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.filter({ method: 'GET', path: APP_ENDPOINT }).count, 1);
        });

      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
