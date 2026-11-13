import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { rawMembers, USER_GIULIA, USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever organisations members update', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with a member email in another case, should send only the role and print the previous one', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([
          { user: USER_SELF, role: 'ADMIN' },
          { user: USER_GIULIA, role: 'DEVELOPER', job: 'Developer' },
        ]),
      );
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member updated',
      });

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        'Giulia.Rossi@Example.com',
        '--role',
        'manager',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Member giulia.rossi@example.com updated in Foo Inc (${ORGANISATION_FOO.id})
            Role:  DEVELOPER → MANAGER
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`,
          body: { role: 'MANAGER' },
        },
      ]);
    });

    it('with a member ID and an unreadable member list, should update it without the previous role', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You are not allowed to list the members',
      });
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member updated',
      });

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--role',
        'developer',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Member ${USER_GIULIA.id} updated in Foo Inc (${ORGANISATION_FOO.id})
            Role:  DEVELOPER
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`,
          body: { role: 'DEVELOPER' },
        },
      ]);
    });
  });

  describe('CLI errors', () => {
    it('without --role, should print a usage error', async () => {
      const result = await runClever(['organisations', 'members', 'update', ORGANISATION_FOO.id, USER_GIULIA.id]);

      assertCleverResult(result, { exitCode: 1, usageError: 'role: missing value' });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with a member that is neither an ID nor an email, should print a usage error', async () => {
      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        'giulia',
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        usageError: 'member-id|email: Use a member ID (user_...) or an email address',
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with an unknown member email, should print an error without updating', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_SELF, role: 'ADMIN' }]),
      );

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Member "giulia.rossi@example.com" not found in Foo Inc',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with a member email and an unreadable member list, should print an error without updating', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You are not allowed to list the members',
      });

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Cannot resolve an email, the member list is not readable: use the member ID (user_...)',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with the personal space, should print an error without updating', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_SELF.id,
        USER_GIULIA.id,
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Personal spaces have no members, use an organisation instead',
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });

  describe('Environment errors', () => {
    it('with a role the caller cannot assign, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_GIULIA, role: 'DEVELOPER' }]),
      );
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 403, {
        id: 6453,
        type: 'error',
        message: 'You cannot assign this role',
      });

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Cannot assign role ADMIN: your role cannot assign it',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`,
          body: { role: 'ADMIN' },
        },
      ]);
    });

    it('with the last admin demoted, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_SELF, role: 'ADMIN' }]),
      );
      await apiMock.respond(
        'PUT',
        `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`,
        403,
        'Cannot demote the last admin of an organisation',
      );

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        'marie.dubois@example.com',
        '--role',
        'developer',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot demote marie.dubois@example.com: Foo Inc (${ORGANISATION_FOO.id}) would have no admin left`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`,
          body: { role: 'DEVELOPER' },
        },
      ]);
    });

    it('with a member unknown to the API, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You are not allowed to list the members',
      });
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 404, {
        id: 6501,
        type: 'error',
        message: 'Member not found',
      });

      const result = await runClever([
        'organisations',
        'members',
        'update',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Member ${USER_GIULIA.id} not found in Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`,
          body: { role: 'ADMIN' },
        },
      ]);
    });
  });
});
