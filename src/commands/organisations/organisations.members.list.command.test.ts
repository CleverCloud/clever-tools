import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { rawMembers, USER_GIULIA, USER_JAN, USER_LUKAS, USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever organisations members list', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with members, should list them without NONE, the current user first, in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([
          { user: { ...USER_LUKAS, preferredMFA: null }, role: 'MANAGER' },
          { user: { ...USER_GIULIA, name: null, preferredMFA: 'NONE' }, role: 'DEVELOPER' },
          { user: USER_JAN, role: 'NONE' },
          { user: USER_SELF, role: 'ADMIN', job: 'CTO' },
        ]),
      );

      const result = await runClever(['organisations', 'members', 'list', ORGANISATION_FOO.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 3 members in Foo Inc (${ORGANISATION_FOO.id}):

          • Marie Dubois <marie.dubois@example.com> (${USER_SELF.id}) you
            Role: ADMIN
            2FA:  enabled
          • giulia.rossi@example.com (${USER_GIULIA.id})
            Role: DEVELOPER
            2FA:  disabled
          • Lukas Schmidt <lukas.schmidt@example.com> (${USER_LUKAS.id})
            Role: MANAGER
            2FA:  disabled
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with members, should list them in json format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([
          { user: { ...USER_GIULIA, name: null, preferredMFA: null }, role: 'DEVELOPER' },
          { user: USER_JAN, role: 'NONE' },
          { user: USER_SELF, role: 'ADMIN' },
        ]),
      );

      const result = await runClever(['organisations', 'members', 'list', ORGANISATION_FOO.id, '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: [
          {
            id: USER_SELF.id,
            email: 'marie.dubois@example.com',
            name: 'Marie Dubois',
            role: 'ADMIN',
            mfa: 'TOTP',
            isMfaEnabled: true,
            isCurrentUser: true,
          },
          {
            id: USER_GIULIA.id,
            email: 'giulia.rossi@example.com',
            name: null,
            role: 'DEVELOPER',
            mfa: null,
            isMfaEnabled: false,
            isCurrentUser: false,
          },
        ],
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with --role in any case and --without-2fa, should only list the matching members in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([
          { user: { ...USER_SELF, preferredMFA: null }, role: 'ADMIN' },
          { user: { ...USER_GIULIA, preferredMFA: null }, role: 'DEVELOPER' },
          { user: USER_LUKAS, role: 'DEVELOPER' },
        ]),
      );

      const result = await runClever([
        'organisations',
        'members',
        'list',
        ORGANISATION_FOO.id,
        '--role',
        'Developer',
        '--without-2fa',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 member in Foo Inc (${ORGANISATION_FOO.id}):

          • Giulia Rossi <giulia.rossi@example.com> (${USER_GIULIA.id})
            Role: DEVELOPER
            2FA:  disabled
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with filters matching nobody, should print that no member was found in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_SELF, role: 'ADMIN' }]),
      );

      const result = await runClever(['organisations', 'members', 'list', 'Foo Inc', '--role', 'accounting']);

      assertCleverResult(result, { exitCode: 0, stdoutText: `🔎 No member found in Foo Inc (${ORGANISATION_FOO.id})` });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });
  });

  describe('CLI errors', () => {
    it('with the role none, should print a usage error', async () => {
      const result = await runClever(['organisations', 'members', 'list', ORGANISATION_FOO.id, '--role', 'none']);

      assertCleverResult(result, {
        exitCode: 1,
        usageError: 'role: Invalid option: expected one of "admin"|"manager"|"developer"|"accounting"',
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with the personal space, should print an error without listing the members', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );

      const result = await runClever(['organisations', 'members', 'list', ORGANISATION_SELF.id]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Personal spaces have no members, use an organisation instead',
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });

  describe('Environment errors', () => {
    it('with a member list refused by the API, should print its message', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You are not allowed to list the members',
      });

      const result = await runClever(['organisations', 'members', 'list', ORGANISATION_FOO.id]);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] You are not allowed to list the members' });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });
  });
});
