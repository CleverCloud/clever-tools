import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { LINKED_APP } from '../../../test/fixtures/app.ts';
import { APP_ID, USER_ID } from '../../../test/fixtures/id.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { assertJsonFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever stop', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with the linked application and a DELETE answering 204, should stop the application and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP] });
      await apiMock.respond('DELETE', `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`, 204);
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`,
          headers: { accept: 'application/json' },
        },
      ]);
      assertJsonFile(fsMock.appConfigFilePath('myapp'), { apps: [LINKED_APP] });
    });

    it('with a DELETE answering 200 with a JSON body, should ignore the response body and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP] });
      await apiMock.respond('DELETE', `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`, 200, {
        id: 'something',
        message: 'ignored',
      });
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`,
        },
      ]);
    });

    it('with a DELETE answering 200 with a text body, should ignore the response body and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP] });
      await apiMock.respond('DELETE', `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`, 200, 'ok');
      fsMock.setCwd('myapp');

      const result = await runClever(['stop']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
      assertApiCalls(await apiMock.getCalls(), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${USER_ID}/applications/${APP_ID}/instances`,
        },
      ]);
    });
  });
});
