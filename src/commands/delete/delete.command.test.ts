import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { APP_NODE, APP_PHP, LINKED_APP_NODE, LINKED_APP_PHP } from '../../../test/fixtures/app.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { KEYS } from '../../../test/lib/cli/keys.ts';
import { assertJsonFile, assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever delete', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  /** Answer the details of `APP_NODE`, which the command reads before deleting it. */
  async function mockGetApplication() {
    await apiMock.respond('GET', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}`, 200, APP_NODE);
  }

  /** Any deletion of an application, whatever the IDs, so that `assertNoDeleteApplication()` catches a wrong one too. */
  const DELETE_APPLICATION_PATH = '/v2/organisations/:ownerId/applications/:appId';

  /** Answer any application deletion: the tests check its IDs on the calls, or that there was none with `assertNoDeleteApplication()`. */
  async function mockDeleteApplication() {
    await apiMock.respond('DELETE', DELETE_APPLICATION_PATH, 200, {
      id: 302,
      type: 'success',
      message: 'The server successfully removed your application',
    });
  }

  /** A single application deletion was sent, the one of `APP_NODE`. Needs `mockDeleteApplication()`. */
  async function assertDeleteApplication() {
    assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_APPLICATION_PATH }), [
      { method: 'DELETE', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}` },
    ]);
  }

  /** No application deletion was sent. Needs `mockDeleteApplication()`: a call no mock answered is left out. */
  async function assertNoDeleteApplication() {
    assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_APPLICATION_PATH }), []);
  }

  describe('Happy path', () => {
    it('with --yes and the linked application, should delete it and unlink it', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
            → Local alias my-node-alias unlinked
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [] });
    });

    it('with --yes and --alias of one of several linked applications, should delete it and unlink only this one', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE, LINKED_APP_PHP] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--alias', 'my-node-alias']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
            → Local alias my-node-alias unlinked
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_PHP] });
    });

    it('with --yes and the default application, should delete it, unlink it and remove the default key', async () => {
      fsMock.writeAppConfigFile('myapp', {
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
        default: APP_NODE.id,
      });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--alias', 'my-node-alias']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
            → Local alias my-node-alias unlinked
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_PHP] });
    });

    it('with --yes and --app of a linked application, should delete it and unlink it', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE, LINKED_APP_PHP] });
      fsMock.setCwd('myapp');
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary({ user: { applications: [APP_NODE] } }));
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--app', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
            → Local alias my-node-alias unlinked
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_PHP] });
    });

    it('with --yes and --app of an application that is not linked, should delete it and leave .clever.json unchanged', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_PHP] });
      fsMock.setCwd('myapp');
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary({ user: { applications: [APP_NODE] } }));
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--app', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_PHP] });
    });

    it('with --yes and no .clever.json, should delete it without creating .clever.json', async () => {
      fsMock.setCwd('myapp');
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary({ user: { applications: [APP_NODE] } }));
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--app', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
        `,
      });
      await assertDeleteApplication();
      assertNoFile(fsMock.appConfigFilePath('myapp'));
    });

    it('without --yes and the application name typed, should delete it and unlink it', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--alias', 'my-node-alias'], {
        interactions: [{ waitFor: 'please type my-node-app to confirm:', send: 'my-node-app\n' }],
      });

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✔ Deleting an application can't be undone, please type my-node-app to confirm: my-node-app
          ✓ Application my-node-app successfully deleted!
            • Application ID: ${APP_NODE.id}
            → Local alias my-node-alias unlinked
        `,
      });
      await assertDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [] });
    });
  });

  describe('CLI errors', () => {
    it('without --yes and a wrong typed name, should abort without deleting', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--alias', 'my-node-alias'], {
        interactions: [{ waitFor: 'please type my-node-app to confirm:', send: 'wrong\n' }],
      });

      assertCleverResult(result, {
        exitCode: 1,
        stdoutText: "✔ Deleting an application can't be undone, please type my-node-app to confirm: wrong",
        stderrText: '[ERROR] No confirmation, aborting application deletion',
      });
      await assertNoDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });

    it('without --yes and a typed name in another case, should abort without deleting', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--alias', 'my-node-alias'], {
        interactions: [{ waitFor: 'please type my-node-app to confirm:', send: 'My-Node-App\n' }],
      });

      assertCleverResult(result, {
        exitCode: 1,
        stdoutText: "✔ Deleting an application can't be undone, please type my-node-app to confirm: My-Node-App",
        stderrText: '[ERROR] No confirmation, aborting application deletion',
      });
      await assertNoDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });
  });

  describe('Environment errors', () => {
    it('without --yes and stdin closing without an answer, should exit silently without deleting', async () => {
      // current behavior: the prompt has no non-interactive guard, it is printed then the process exits 1 silently
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--alias', 'my-node-alias'], {
        interactions: [{ waitFor: 'please type my-node-app to confirm:', send: [] }],
      });

      assertCleverResult(result, {
        exitCode: 1,
        stdoutText: "? Deleting an application can't be undone, please type my-node-app to confirm:",
      });
      await assertNoDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });

    it('without --yes and an interrupted prompt, should exit silently without deleting', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetApplication();
      await mockDeleteApplication();

      const result = await runClever(['delete', '--alias', 'my-node-alias'], {
        interactions: [{ waitFor: 'please type my-node-app to confirm:', send: KEYS.CTRL_C }],
      });

      assertCleverResult(result, {
        exitCode: 1,
        outputText: "? Deleting an application can't be undone, please type my-node-app to confirm:",
      });
      await assertNoDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });
  });

  describe('HTTP errors', () => {
    it('with a linked application already deleted, should fail on the GET application 404 without deleting', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await apiMock.respond('GET', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}`, 404, {
        id: 4004,
        message: "The provided id doesn't belong to any app",
        type: 'error',
      });
      await mockDeleteApplication();

      const result = await runClever(['delete', '--yes', '--alias', 'my-node-alias']);

      assertCleverResult(result, { exitCode: 1, stderrText: "[ERROR] The provided id doesn't belong to any app" });
      await assertNoDeleteApplication();
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });
    it('with an application of an organisation the user is not allowed to delete, should fail on the DELETE 403 without unlinking it', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_PHP] });
      fsMock.setCwd('myapp');
      await apiMock.respond('GET', `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}`, 200, APP_PHP);
      await apiMock.respond('DELETE', DELETE_APPLICATION_PATH, 403, {
        id: 8102,
        message: 'You are not allowed to remove this application',
        type: 'error',
      });

      const result = await runClever(['delete', '--yes', '--alias', 'my-php-alias']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] You are not allowed to remove this application' });
      assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_APPLICATION_PATH }), [
        { method: 'DELETE', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}` },
      ]);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_PHP] });
    });
  });
});
