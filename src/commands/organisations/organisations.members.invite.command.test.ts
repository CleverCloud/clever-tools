import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { USER_GIULIA, USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

/**
 * Raw body of `POST /v2/organisations/{id}/members`, as returned by the API (checked against the real API): the pending
 * invitation of `USER_GIULIA` to `ORGANISATION_FOO` by `USER_SELF`, dates with microseconds, expiring after 48 hours.
 */
const INVITATION_GIULIA = {
  id: '00000000-0000-4000-8000-000000000600',
  organisationId: ORGANISATION_FOO.id,
  inviteeEmail: USER_GIULIA.email,
  inviterUserId: USER_SELF.id,
  role: 'DEVELOPER',
  status: 'pending',
  createdAt: '2027-02-03T14:16:00.731194+00:00',
  acceptedAt: null,
  expiresAt: '2027-02-05T14:16:00.714691+00:00',
};

describe('clever organisations members invite', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('without --role, should invite as a developer and print the expiration date', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('POST', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 201, INVITATION_GIULIA);

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Invitation sent to giulia.rossi@example.com as DEVELOPER in Foo Inc (${ORGANISATION_FOO.id})
            Expires: Feb 5, 2027, 14:16 UTC
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        {
          method: 'POST',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members`,
          body: { email: 'giulia.rossi@example.com', role: 'DEVELOPER' },
        },
      ]);
    });
  });

  describe('CLI errors', () => {
    it('with an invalid email, should print a usage error', async () => {
      const result = await runClever(['organisations', 'members', 'invite', ORGANISATION_FOO.id, 'giulia']);

      assertCleverResult(result, { exitCode: 1, usageError: 'email: Invalid email address' });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with the personal space, should print an error without inviting', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_SELF.id,
        'giulia.rossi@example.com',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Personal spaces have no members, use an organisation instead',
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });

  describe('Environment errors', () => {
    it('with an invitation refused for a missing OAuth right, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('POST', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You cannot add members to this organisation',
      });

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] Cannot invite giulia.rossi@example.com: the OAuth right manage_organisations_members is missing or the invitation is not allowed',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        {
          method: 'POST',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members`,
          body: { email: 'giulia.rossi@example.com', role: 'DEVELOPER' },
        },
      ]);
    });

    it('with a role the caller cannot assign, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('POST', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6453,
        type: 'error',
        message: 'You cannot assign this role',
      });

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
        '--role',
        'admin',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Cannot assign role ADMIN: your role cannot assign it',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        {
          method: 'POST',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members`,
          body: { email: 'giulia.rossi@example.com', role: 'ADMIN' },
        },
      ]);
    });

    it('with an address that is already a member, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('POST', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 409, {
        id: 409,
        type: 'error',
        message: 'User is already a member',
      });

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] giulia.rossi@example.com is already a member of Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        {
          method: 'POST',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members`,
          body: { email: 'giulia.rossi@example.com', role: 'DEVELOPER' },
        },
      ]);
    });

    it('with the invitation rate limit reached, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond(
        'POST',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        403,
        'Rate limit exceeded for member invitation',
      );

      const result = await runClever([
        'organisations',
        'members',
        'invite',
        ORGANISATION_FOO.id,
        'giulia.rossi@example.com',
      ]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] Invitation limit reached for giulia.rossi@example.com (4 per hour per recipient, 11 per hour per sender), retry later',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        {
          method: 'POST',
          path: `/v2/organisations/${ORGANISATION_FOO.id}/members`,
          body: { email: 'giulia.rossi@example.com', role: 'DEVELOPER' },
        },
      ]);
    });
  });
});
