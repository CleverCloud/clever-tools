import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { rawMembers, USER_GIULIA, USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever organisations members remove', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with --yes and a member email, should remove the member', async () => {
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
          { user: USER_SELF, role: 'ADMIN' },
          { user: USER_GIULIA, role: 'DEVELOPER' },
        ]),
      );
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member removed',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Member giulia.rossi@example.com removed from Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}` },
      ]);
    });

    it('with --yes and the current user, should leave the organisation', async () => {
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
          { user: USER_SELF, role: 'DEVELOPER' },
          { user: USER_GIULIA, role: 'ADMIN' },
        ]),
      );
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member removed',
      });

      const result = await runClever(['organisations', 'members', 'remove', 'Foo Inc', USER_SELF.id, '--yes']);

      assertCleverResult(result, { exitCode: 0, stdoutText: `✓ You left Foo Inc (${ORGANISATION_FOO.id})` });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}` },
      ]);
    });

    it('with --yes, a member ID and an unreadable member list, should remove the member by ID', async () => {
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
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member removed',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Member ${USER_GIULIA.id} removed from Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}` },
      ]);
    });

    it('with --yes and an email starting with user_, should remove the member', async () => {
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
          { user: USER_SELF, role: 'ADMIN' },
          { user: { ...USER_GIULIA, email: 'user_giulia@example.com' }, role: 'DEVELOPER' },
        ]),
      );
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member removed',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        'user_giulia@example.com',
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Member user_giulia@example.com removed from Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}` },
      ]);
    });

    it('with --yes and the current user ID in upper case, should leave the organisation', async () => {
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
          { user: USER_SELF, role: 'DEVELOPER' },
          { user: USER_GIULIA, role: 'ADMIN' },
        ]),
      );
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`, 200, {
        id: 0,
        type: 'info',
        message: 'Member removed',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_SELF.id.toUpperCase(),
        '--yes',
      ]);

      assertCleverResult(result, { exitCode: 0, stdoutText: `✓ You left Foo Inc (${ORGANISATION_FOO.id})` });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}` },
      ]);
    });

    it('with --yes, the current user ID in upper case and an unreadable member list, should leave the organisation', async () => {
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
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id.toUpperCase()}`,
        200,
        { id: 0, type: 'info', message: 'Member removed' },
      );

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_SELF.id.toUpperCase(),
        '--yes',
      ]);

      assertCleverResult(result, { exitCode: 0, stdoutText: `✓ You left Foo Inc (${ORGANISATION_FOO.id})` });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id.toUpperCase()}` },
      ]);
    });

    it.todo('with a terminal and the answer "y", should remove the member');
    it.todo('with a terminal and the answer "n", should not remove the member');
    it.todo('with a terminal, the current user and the answer "y", should leave the organisation');
    it.todo('with a terminal, the current user and the answer "n", should not leave the organisation');
  });

  describe('CLI errors', () => {
    it('without --yes and without a terminal, should print an error without removing', async () => {
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
        rawMembers([{ user: USER_GIULIA, role: 'DEVELOPER' }]),
      );

      const result = await runClever(
        ['organisations', 'members', 'remove', ORGANISATION_FOO.id, 'giulia.rossi@example.com'],
        {
          stdin: 'y\n',
        },
      );

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] This command requires an interactive terminal. Use --yes to skip the confirmation.',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with an unknown member ID, should print an error without removing', async () => {
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

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Member "${USER_GIULIA.id}" not found in Foo Inc`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with the personal space, should print an error without removing', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_SELF.id,
        USER_GIULIA.id,
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Personal spaces have no members, use an organisation instead',
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });

  describe('Environment errors', () => {
    it('with a removal refused for the role, should print an error', async () => {
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
        rawMembers([{ user: USER_GIULIA, role: 'ADMIN' }]),
      );
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 403, {
        id: 6452,
        type: 'error',
        message: 'You cannot remove this member',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Cannot remove giulia.rossi@example.com: your role does not allow removing this member',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}` },
      ]);
    });

    it('with the last admin removed, should print an error', async () => {
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
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`,
        403,
        'Cannot remove the last admin',
      );

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        'marie.dubois@example.com',
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot remove marie.dubois@example.com: Foo Inc (${ORGANISATION_FOO.id}) would have no admin left`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}` },
      ]);
    });

    it('with the last member removed, should print an error', async () => {
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
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}`,
        403,
        'Cannot remove the last member',
      );

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        'marie.dubois@example.com',
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot remove marie.dubois@example.com: Foo Inc (${ORGANISATION_FOO.id}) would have no member left`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_SELF.id}` },
      ]);
    });

    it('with a member unknown to the API, should print an error', async () => {
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
      await apiMock.respond('DELETE', `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}`, 404, {
        id: 6501,
        type: 'error',
        message: 'Member not found',
      });

      const result = await runClever([
        'organisations',
        'members',
        'remove',
        ORGANISATION_FOO.id,
        USER_GIULIA.id,
        '--yes',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Member ${USER_GIULIA.id} not found in Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: '/v2/self' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
        { method: 'DELETE', path: `/v2/organisations/${ORGANISATION_FOO.id}/members/${USER_GIULIA.id}` },
      ]);
    });
  });
});
