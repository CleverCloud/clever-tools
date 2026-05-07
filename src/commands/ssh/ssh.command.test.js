import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { APP_ID, ORGA_ID } from '../../../test/fixtures/id.js';
import { startMockSshServer } from '../../../test/fixtures/ssh-server.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 * @typedef {import('../../../test/fixtures/ssh-server.js').MockSshServer} MockSshServer
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

describe('ssh command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should error when both --app and --alias are provided', async () => {
    const result = await newScenario()
      .thenRunCli(['ssh', '--app', APP_ID, '--alias', 'test-app'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Only one of the `--app` or `--alias` options can be set at a time');
  });

  it('should error when not in an app directory and --app is missing', async () => {
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

  it('should error when app config has multiple aliases and no --alias is given', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
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

  it('should error when --alias does not match any linked application', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG_MULTI)
      .thenRunCli(['ssh', '--alias', 'unknown'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] There are no applications matching alias unknown');
  });

  it('should error when the application has no running instances', async () => {
    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
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

  it('should error when multiple instances are running and stdout is not a TTY', async () => {
    const instances = [
      { id: 'instance_1', displayName: 'Instance one', instanceNumber: 0, state: 'UP' },
      { id: 'instance_2', displayName: 'Instance two', instanceNumber: 1, state: 'UP' },
    ];

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
      .respond({ status: 200, body: instances })
      .thenRunCli(['ssh'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
        assert.strictEqual(calls.first.pathParams?.appId, APP_ID);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Multiple instances are running. Cannot select in non-interactive mode.');
  });
});

describe('ssh command — real ssh', () => {
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

  it('should run --command and stream stdout cleanly past the marker', async () => {
    ssh.setShellScript({
      'echo hello': {
        stdout: 'hello\n',
        preMarkerStdout: 'Welcome to gateway\nLast login: never\n',
      },
    });

    const instances = [{ id: 'instance_abc', displayName: 'one', instanceNumber: 0, state: 'UP' }];

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
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

  it('should escape single quotes in --command and round-trip them to the server', async () => {
    const inner = `echo "it's working"`;
    ssh.setShellScript({ [inner]: { stdout: "it's working\n" } });

    const instances = [{ id: 'instance_q', displayName: 'q', instanceNumber: 0, state: 'UP' }];

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
      .respond({ status: 200, body: instances })
      .thenRunCli(['ssh', '--command', inner, '--identity-file', ssh.identityFile], { env: realSshEnv() })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });

    assert.strictEqual(result.stdout, "it's working");
    assert.strictEqual(result.stderr, '');
    assert.strictEqual(ssh.connections[0]?.innerCommand, inner);
  });

  it('should forward post-marker stderr from the remote command', async () => {
    // Note: pre-marker stderr filtering is best-effort — the `started` flag flips on stdout,
    // and ssh2 carries stdout / stderr on separate extended-data channels with no ordering
    // guarantee, so a pre-marker stderr chunk can race past the marker and leak through.
    // We only assert the deterministic case here: a script that writes nothing before the
    // marker forwards exactly the post-marker stderr.
    ssh.setShellScript({ '*': { stderr: 'real-error\n' } });

    const instances = [{ id: 'instance_e', displayName: 'e', instanceNumber: 0, state: 'UP' }];

    const result = await newScenario()
      .withAppConfigFile(CLEVER_APP_CONFIG)
      .when({ method: 'GET', path: '/v2/organisations/:ownerId/applications/:appId/instances' })
      .respond({ status: 200, body: instances })
      .thenRunCli(['ssh', '--command', 'true', '--identity-file', ssh.identityFile], { env: realSshEnv() })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, 'real-error');
  });
});
