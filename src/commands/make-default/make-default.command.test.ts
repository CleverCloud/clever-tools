import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { APP_NODE, APP_PHP, LINKED_APP_NODE, LINKED_APP_PHP } from '../../../test/fixtures/app.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { assertJsonFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever make-default', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with several linked applications and no default, should write it as default and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE, LINKED_APP_PHP] });
      fsMock.setCwd('myapp');

      const result = await runClever(['make-default', 'my-php-alias']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ The application my-php-alias has been set as default' });
      assertApiCalls(await apiMock.getCalls(), []);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), {
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
        default: APP_PHP.id,
      });
    });

    it('with the only linked application and no default, should write it as default', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');

      const result = await runClever(['make-default', 'my-node-alias']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: '✓ The application my-node-alias has been set as default',
      });
      assertApiCalls(await apiMock.getCalls(), []);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), {
        apps: [LINKED_APP_NODE],
        default: APP_NODE.id,
      });
    });

    it('with another application already as default, should replace the default in place', async () => {
      fsMock.writeAppConfigFile('myapp', {
        default: APP_NODE.id,
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
      });
      fsMock.setCwd('myapp');

      const result = await runClever(['make-default', 'my-php-alias']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ The application my-php-alias has been set as default' });
      assertApiCalls(await apiMock.getCalls(), []);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), {
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
        default: APP_PHP.id,
      });
    });

    it('with the application already as default, should leave .clever.json unchanged', async () => {
      fsMock.writeAppConfigFile('myapp', {
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
        default: APP_NODE.id,
      });
      fsMock.setCwd('myapp');

      const result = await runClever(['make-default', 'my-node-alias']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: '✓ The application my-node-alias has been set as default',
      });
      assertApiCalls(await apiMock.getCalls(), []);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), {
        apps: [LINKED_APP_NODE, LINKED_APP_PHP],
        default: APP_NODE.id,
      });
    });
  });

  describe('CLI errors', () => {
    it('should reject a missing alias', async () => {
      const result = await runClever(['make-default']);

      assertCleverResult(result, { exitCode: 1, usageError: 'app-alias: missing value' });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
