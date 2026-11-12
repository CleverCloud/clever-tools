import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_BAR, ORGANISATION_FOO, ORGANISATION_SELF } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { rawMembers, USER_GIULIA, USER_JAN, USER_LUKAS, USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever organisations get', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with an organisation ID, should print the organisation and count the members without NONE in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'MANAGER' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([
          { user: USER_SELF, role: 'ADMIN' },
          { user: USER_GIULIA, role: 'DEVELOPER' },
          { user: USER_JAN, role: 'NONE' },
        ]),
      );

      const result = await runClever(['organisations', 'get', ORGANISATION_FOO.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Foo Inc (${ORGANISATION_FOO.id})

          General
            Role:         MANAGER
            Description:  Main organisation
            Members:      2 members (1 admin)

          Billing
            Name:     Marie Dubois
            Email:    billing@example.com
            Address:  34 rue de l'Exemple
            City:     Nantes
            Zipcode:  44000
            Country:  FRANCE

          Support
            Premium:           no
            Emergency number:  -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with an organisation name, a company and a VAT number, should print them in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({
          organisations: [
            { organisation: ORGANISATION_FOO, role: 'ADMIN' },
            { organisation: ORGANISATION_BAR, role: 'ADMIN' },
          ],
        }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_BAR.id}`, 200, {
        ...ORGANISATION_BAR,
        address: '',
        cleverEnterprise: true,
        emergencyNumber: '+31 20 000 0000',
      });
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_BAR.id}/members`,
        200,
        rawMembers([
          { user: USER_SELF, role: 'ADMIN' },
          { user: USER_GIULIA, role: 'ADMIN' },
          { user: USER_LUKAS, role: 'ACCOUNTING' },
        ]),
      );

      const result = await runClever(['organisations', 'get', 'Bar Inc']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Bar Inc (${ORGANISATION_BAR.id})

          General
            Role:         ADMIN
            Description:  -
            Members:      3 members (2 admins)

          Billing
            Name:        Marie Dubois
            Company:     Bar B.V.
            VAT number:  NL000000000B01 (VALID)
            Email:       billing@bar.example.com
            Address:     -
            City:        Amsterdam
            Zipcode:     1012 LG
            Country:     NETHERLANDS

          Support
            Premium:           yes
            Emergency number:  +31 20 000 0000
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_BAR.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_BAR.id}/members` },
      ]);
    });

    it('with incomplete billing details, should print a warning after the sections in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        canPay: false,
        customerFullName: null,
        billingEmail: null,
        address: null,
        city: null,
        zipcode: null,
        country: null,
      });
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_SELF, role: 'ADMIN' }]),
      );

      const result = await runClever(['organisations', 'get', ORGANISATION_FOO.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Foo Inc (${ORGANISATION_FOO.id})

          General
            Role:         ADMIN
            Description:  Main organisation
            Members:      1 member (1 admin)

          Billing
            Name:     -
            Email:    -
            Address:  -
            City:     -
            Zipcode:  -
            Country:  -

          Support
            Premium:           no
            Emergency number:  -

          ⚠ Billing details incomplete, payment impossible
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with a refused member list, should print an unknown member count in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ACCOUNTING' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}/members`, 403, {
        id: 6451,
        type: 'error',
        message: 'You are not allowed to list the members',
      });

      const result = await runClever(['organisations', 'get', ORGANISATION_FOO.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Foo Inc (${ORGANISATION_FOO.id})

          General
            Role:         ACCOUNTING
            Description:  Main organisation
            Members:      -

          Billing
            Name:     Marie Dubois
            Email:    billing@example.com
            Address:  34 rue de l'Exemple
            City:     Nantes
            Zipcode:  44000
            Country:  FRANCE

          Support
            Premium:           no
            Emergency number:  -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });

    it('with the personal space, should print it without members in human format', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_SELF.id}`, 200, ORGANISATION_SELF);

      const result = await runClever(['organisations', 'get', ORGANISATION_SELF.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Marie Dubois (${ORGANISATION_SELF.id}) personal

          General
            Role:         ADMIN
            Description:  Personal space

          Billing
            Name:     Marie Dubois
            Email:    marie.dubois.billing@example.com
            Address:  12 rue de l'Exemple
            City:     Paris
            Zipcode:  75001
            Country:  FRANCE

          Support
            Premium:           no
            Emergency number:  -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_SELF.id}` },
      ]);
    });

    it('with an organisation, should print it in json format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_BAR, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_BAR.id}`, 200, ORGANISATION_BAR);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_BAR.id}/members`,
        200,
        rawMembers([
          { user: USER_SELF, role: 'ADMIN' },
          { user: USER_GIULIA, role: 'DEVELOPER' },
          { user: USER_JAN, role: 'NONE' },
        ]),
      );

      const result = await runClever(['organisations', 'get', ORGANISATION_BAR.id, '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: {
          id: ORGANISATION_BAR.id,
          name: 'Bar Inc',
          role: 'ADMIN',
          isPersonal: false,
          description: null,
          avatar: null,
          membersCount: 2,
          adminsCount: 1,
          billingName: 'Marie Dubois',
          company: 'Bar B.V.',
          vatNumber: 'NL000000000B01',
          vatState: 'VALID',
          billingEmail: 'billing@bar.example.com',
          address: 'Voorbeeldstraat 78',
          city: 'Amsterdam',
          zipcode: '1012 LG',
          country: 'NETHERLANDS',
          canPay: true,
          isPremium: false,
          emergencyNumber: null,
        },
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_BAR.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_BAR.id}/members` },
      ]);
    });

    it('with the personal space, should print null member counts in json format', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_SELF.id}`, 200, {
        ...ORGANISATION_SELF,
        canPay: false,
      });

      const result = await runClever(['organisations', 'get', ORGANISATION_SELF.id, '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: {
          id: ORGANISATION_SELF.id,
          name: 'Marie Dubois',
          role: 'ADMIN',
          isPersonal: true,
          description: 'Personal space',
          avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000.jpg',
          membersCount: null,
          adminsCount: null,
          billingName: 'Marie Dubois',
          company: null,
          vatNumber: null,
          vatState: 'NOT_APPLICABLE',
          billingEmail: 'marie.dubois.billing@example.com',
          address: "12 rue de l'Exemple",
          city: 'Paris',
          zipcode: '75001',
          country: 'FRANCE',
          canPay: false,
          isPremium: false,
          emergencyNumber: null,
        },
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_SELF.id}` },
      ]);
    });

    it('with an organisation ID in upper case, should print the organisation in human format', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/members`,
        200,
        rawMembers([{ user: USER_SELF, role: 'ADMIN' }]),
      );

      const result = await runClever(['organisations', 'get', ORGANISATION_FOO.id.toUpperCase()]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Foo Inc (${ORGANISATION_FOO.id})

          General
            Role:         ADMIN
            Description:  Main organisation
            Members:      1 member (1 admin)

          Billing
            Name:     Marie Dubois
            Email:    billing@example.com
            Address:  34 rue de l'Exemple
            City:     Nantes
            Zipcode:  44000
            Country:  FRANCE

          Support
            Premium:           no
            Emergency number:  -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/members` },
      ]);
    });
  });

  describe('CLI errors', () => {
    it('without an organisation, should print a usage error', async () => {
      const result = await runClever(['organisations', 'get']);

      assertCleverResult(result, { exitCode: 1, usageError: 'org-id|org-name: missing value' });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with an unknown organisation name, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );

      const result = await runClever(['organisations', 'get', 'Unknown']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Organisation "Unknown" not found' });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with an unknown organisation ID, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );

      const result = await runClever(['organisations', 'get', ORGANISATION_BAR.id]);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Organisation "${ORGANISATION_BAR.id}" not found`,
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with a name shared by two organisations, should print an ambiguous name error listing their IDs', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({
          organisations: [
            { organisation: ORGANISATION_FOO, role: 'ADMIN' },
            { organisation: { ...ORGANISATION_BAR, name: 'Foo Inc' }, role: 'ADMIN' },
          ],
        }),
      );

      const result = await runClever(['organisations', 'get', 'Foo Inc']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `
          [ERROR] Ambiguous name Foo Inc, use the ID instead:
                    - Foo Inc (${ORGANISATION_FOO.id})
                    - Foo Inc (${ORGANISATION_BAR.id})
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });
  });
});
