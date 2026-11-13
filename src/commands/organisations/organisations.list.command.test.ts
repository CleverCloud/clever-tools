import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_BAR, ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever organisations list', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with a personal space and two organisations, should list them in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({
          organisations: [
            { organisation: ORGANISATION_FOO, role: 'ADMIN' },
            { organisation: ORGANISATION_BAR, role: 'DEVELOPER' },
          ],
        }),
      );

      const result = await runClever(['organisations', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 3 organisations:

          • Marie Dubois (${ORGANISATION_SELF.id}) personal
            Role: ADMIN
          • Foo Inc (${ORGANISATION_FOO.id})
            Role: ADMIN
          • Bar Inc (${ORGANISATION_BAR.id})
            Role: DEVELOPER
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with only the personal space, should use the singular in human format', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());

      const result = await runClever(['organisations', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 organisation:

          • Marie Dubois (${ORGANISATION_SELF.id}) personal
            Role: ADMIN
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with a personal space and an organisation, should list them in json format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'MANAGER' }] }),
      );

      const result = await runClever(['organisations', 'list', '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: [
          { id: ORGANISATION_SELF.id, name: 'Marie Dubois', role: 'ADMIN', isPersonal: true },
          { id: ORGANISATION_FOO.id, name: 'Foo Inc', role: 'MANAGER', isPersonal: false },
        ],
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });

  describe('CLI errors', () => {
    it('with an unknown format, should print a usage error', async () => {
      const result = await runClever(['organisations', 'list', '--format', 'xml']);

      assertCleverResult(result, { exitCode: 1, usageError: 'format: Invalid option: expected one of "human"|"json"' });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
