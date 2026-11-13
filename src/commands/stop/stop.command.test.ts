import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { APP_NODE, LINKED_APP_NODE } from '../../../test/fixtures/app.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { assertJsonFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever stop', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with the linked application and a DELETE answering 204, should stop the application and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
        204,
      );
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
          headers: { accept: 'application/json' },
        },
      ]);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP_NODE] });
    });

    it('with a DELETE answering 200 with a JSON body, should ignore the response body and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
        200,
        {
          id: 'something',
          message: 'ignored',
        },
      );
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
        },
      ]);
    });

    it('with a DELETE answering 200 with a text body, should ignore the response body and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
        200,
        'ok',
      );
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`,
        },
      ]);
    });
  });
});
