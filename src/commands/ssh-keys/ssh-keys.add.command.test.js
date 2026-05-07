import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const PUB_KEY_CONTENT = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyContent test@example.com';

describe('ssh-keys add command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;

  before(async () => {
    newScenario = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should add an SSH key from a public key file', async () => {
    const result = await newScenario()
      .withAppFile('id_ed25519.pub', `${PUB_KEY_CONTENT}\n`)
      .when({ method: 'PUT', path: '/v2/self/keys/:key' })
      .respond({ status: 200, body: {} })
      .thenRunCli(['ssh-keys', 'add', 'my-key', 'id_ed25519.pub'])
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.method, 'PUT');
        assert.strictEqual(calls.first.pathParams?.key, 'my-key');
        assert.strictEqual(calls.first.body, PUB_KEY_CONTENT);
      });

    assert.strictEqual(result.stdout, '✓ SSH key my-key added successfully');
    assert.strictEqual(result.stderr, '');
  });

  it('should URL-encode key names with special characters', async () => {
    const result = await newScenario()
      .withAppFile('id_ed25519.pub', PUB_KEY_CONTENT)
      .when({ method: 'PUT', path: '/v2/self/keys/:key' })
      .respond({ status: 200, body: {} })
      .thenRunCli(['ssh-keys', 'add', 'my key/with special', 'id_ed25519.pub'])
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
        assert.strictEqual(calls.first.pathParams?.key, 'my key/with special');
      });

    assert.strictEqual(result.stdout, '✓ SSH key my key/with special added successfully');
  });

  it('should error when the public key file does not exist', async () => {
    const result = await newScenario()
      .withAppFile('placeholder.txt', 'placeholder')
      .thenRunCli(['ssh-keys', 'add', 'my-key', 'missing.pub'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 0);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] File missing.pub does not exist');
  });

  it('should error when the API rejects the key as invalid (505)', async () => {
    const result = await newScenario()
      .withAppFile('id_ed25519.pub', 'not a real ssh key')
      .when({ method: 'PUT', path: '/v2/self/keys/:key' })
      .respond({ status: 400, body: { id: 505 } })
      .thenRunCli(['ssh-keys', 'add', 'my-key', 'id_ed25519.pub'], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });

    assert.strictEqual(
      result.stderr,
      `[ERROR] This SSH key is not valid, please make sure you're pointing to the public key file`,
    );
  });
});
