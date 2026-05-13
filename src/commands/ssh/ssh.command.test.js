import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { multiAppConfig, singleAppConfig } from '../../../test/fixtures/app-config.js';
import { APP_ALIAS_MUTEX_ERROR, NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { idsCache } from '../../../test/fixtures/ids-cache.js';
import { SELF } from '../../../test/fixtures/self.js';
import { startMockSshServer } from '../../../test/fixtures/ssh-server.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 * @typedef {import('../../../test/fixtures/ssh-server.js').MockSshServer} MockSshServer
 */

const INSTANCES_ENDPOINT = '/v2/organisations/:ownerId/applications/:appId/instances';

const APP_NAME = 'test-app';
const UNKNOWN_APP_ID = 'app_99999999-9999-4999-8999-999999999999';

const SUMMARY = {
  user: { ...SELF, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [{ id: APP_ID, name: APP_NAME, variantSlug: 'node' }],
      addons: [],
      consumers: [],
    },
  ],
};

const APP_IDS_CACHE = idsCache({ owners: { [APP_ID]: ORGA_ID } });

const NO_INSTANCES_ERROR = '[ERROR] No running instances found for this application';

describe('ssh command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {MockSshServer} */
  let ssh;

  before(async () => {
    newScenario = await hooks.before();
    ssh = await startMockSshServer();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
    ssh.reset();
  });

  after(async () => {
    await ssh.close();
    await hooks.after();
  });

  /**
   * Build the env block every real-ssh test needs:
   * - SSH_GATEWAY points the CLI at the embedded ssh2 server (via the URI form so the port travels with it).
   * - PATH starts with the fixture's bin/ shim, which prepends `-F`/`-o UserKnownHostsFile=`
   *   to every ssh invocation so the OpenSSH client trusts the embedded host key.
   */
  function realSshEnv() {
    return {
      SSH_GATEWAY: ssh.gatewayUri,
      PATH: `${ssh.binDir}:${process.env.PATH ?? ''}`,
    };
  }

  describe('happy path', () => {
    it('runs --command and streams stdout cleanly past the marker', async () => {
      ssh.setShellScript({
        'echo hello': {
          stdout: 'hello\n',
          preMarkerStdout: 'Welcome to gateway\nLast login: never\n',
        },
      });

      const instances = [{ id: 'instance_abc', displayName: 'one', instanceNumber: 0, state: 'UP' }];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh', '--command', 'echo hello', '--identity-file', ssh.identityFile], { env: realSshEnv() })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, 'hello');
      assert.strictEqual(result.stderr, '');
      assert.strictEqual(ssh.connections.length, 1);
      const conn = ssh.connections[0];
      assert.strictEqual(conn.username, 'testuser');
      assert.strictEqual(conn.destination, 'instance_abc');
      assert.strictEqual(conn.innerCommand, 'echo hello');
      assert.strictEqual(conn.authAccepted, true);
    });

    it('escapes single quotes in --command and round-trips them to the server', async () => {
      const inner = `echo "it's working"`;
      ssh.setShellScript({ [inner]: { stdout: "it's working\n" } });

      const instances = [{ id: 'instance_q', displayName: 'q', instanceNumber: 0, state: 'UP' }];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh', '--command', inner, '--identity-file', ssh.identityFile], { env: realSshEnv() })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, "it's working");
      assert.strictEqual(result.stderr, '');
      assert.strictEqual(ssh.connections[0]?.innerCommand, inner);
    });

    it('forwards post-marker stderr from the remote command', async () => {
      // Note: pre-marker stderr filtering is best-effort — the `started` flag flips on stdout,
      // and ssh2 carries stdout / stderr on separate extended-data channels with no ordering
      // guarantee, so a pre-marker stderr chunk can race past the marker and leak through.
      // We only assert the deterministic case here: a script that writes nothing before the
      // marker forwards exactly the post-marker stderr.
      ssh.setShellScript({ '*': { stderr: 'real-error\n' } });

      const instances = [{ id: 'instance_e', displayName: 'e', instanceNumber: 0, state: 'UP' }];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh', '--command', 'true', '--identity-file', ssh.identityFile], { env: realSshEnv() })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, 'real-error');
    });
  });

  describe('linked application resolution', () => {
    it('errors when not in an app directory and --app is missing', async () => {
      const result = await newScenario()
        .thenRunCli(['ssh'], { expectExitCode: 1 })
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
        .thenRunCli(['ssh'], { expectExitCode: 1 })
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
        .thenRunCli(['ssh', '--alias', 'unknown'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
    });

    it('errors when both --app and --alias are provided', async () => {
      const result = await newScenario()
        .thenRunCli(['ssh', '--app', APP_ID, '--alias', 'test-app'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, APP_ALIAS_MUTEX_ERROR);
    });
  });

  describe('app ID resolution', () => {
    /**
     * Resolution succeeds → instances endpoint is hit and returns []. The command then
     * errors with NO_INSTANCES_ERROR; we use that as the success marker.
     * @param {ReturnType<NewCliScenario>} scenario
     */
    function withEmptyInstances(scenario) {
      return scenario.when({ method: 'GET', path: INSTANCES_ENDPOINT }).respond({ status: 200, body: [] });
    }

    // === app ID (app_<UUID>) ===

    it('resolves an app ID from cache without calling /v2/summary', async () => {
      const result = await withEmptyInstances(newScenario().withIdsCacheFile(APP_IDS_CACHE))
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('resolves an app ID via /v2/summary when cache is empty', async () => {
      const result = await withEmptyInstances(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('errors when an app ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['ssh', '--app', UNKNOWN_APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when an app ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['ssh', '--app', APP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === app name — goes directly to /v2/summary (no cache lookup) ===

    it('resolves an app name via /v2/summary', async () => {
      const result = await withEmptyInstances(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['ssh', '--app', APP_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.path, '/v2/summary');
          assert.strictEqual(calls.last.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stderr, NO_INSTANCES_ERROR);
    });

    it('errors when an app name is not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['ssh', '--app', 'unknown-app'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] Application not found');
    });

    it('errors when /v2/summary returns 404 for an app name', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['ssh', '--app', APP_NAME], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stderr, '[ERROR] not found');
    });
  });

  describe('instance selection', () => {
    it('errors when the application has no running instances', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: [] })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] No running instances found for this application');
    });

    it('errors when multiple instances are running and stdout is not a TTY', async () => {
      const instances = [
        { id: 'instance_1', displayName: 'Instance one', instanceNumber: 0, state: 'UP' },
        { id: 'instance_2', displayName: 'Instance two', instanceNumber: 1, state: 'UP' },
      ];

      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 200, body: instances })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(
        result.stderr,
        '[ERROR] Multiple instances are running. Cannot select in non-interactive mode.',
      );
    });
  });

  describe('API errors', () => {
    it('reports the error body when the instances endpoint returns a non-2xx status', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the instances endpoint returns 401', async () => {
      const result = await newScenario()
        .withAppConfigFile(singleAppConfig())
        .when({ method: 'GET', path: INSTANCES_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['ssh'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });
});
