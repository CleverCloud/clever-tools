import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_BAR, ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever orgs list', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with a personal space and two organisations, should list the personal space first, then the organisations by name, in human format', async () => {
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

      const result = await runClever(['orgs', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ┌──────────────┬───────────────────────────────────────────┬───────────┐
          │ NAME         │ ID                                        │ ROLE      │
          ├──────────────┼───────────────────────────────────────────┼───────────┤
          │ Marie Dubois │ ${ORGANISATION_SELF.id} │ ADMIN     │
          │ Bar Inc      │ ${ORGANISATION_BAR.id} │ DEVELOPER │
          │ Foo Inc      │ ${ORGANISATION_FOO.id} │ ADMIN     │
          └──────────────┴───────────────────────────────────────────┴───────────┘
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with only the personal space, should list it in human format', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());

      const result = await runClever(['orgs', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ┌──────────────┬───────────────────────────────────────────┬───────┐
          │ NAME         │ ID                                        │ ROLE  │
          ├──────────────┼───────────────────────────────────────────┼───────┤
          │ Marie Dubois │ ${ORGANISATION_SELF.id} │ ADMIN │
          └──────────────┴───────────────────────────────────────────┴───────┘
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

      const result = await runClever(['orgs', 'list', '--format', 'json']);

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
      const result = await runClever(['orgs', 'list', '--format', 'xml']);

      assertCleverResult(result, { exitCode: 1, usageError: 'format: Invalid option: expected one of "human"|"json"' });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
