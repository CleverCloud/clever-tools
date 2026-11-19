import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ORGANISATION_FOO } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever orgs update', () => {
  const { apiMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with --name, should send the full body, the current country included as its code, and print the changed fields', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        name: 'Foo Corp',
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--name', 'Foo Corp']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Corp (${ORGANISATION_FOO.id}) updated
            Name:  Foo Inc → Foo Corp
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Corp',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Nantes',
            zipcode: '44000',
            country: 'FR',
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with --country in lower case, should send the code in upper case and print the new country', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        country: 'NETHERLANDS',
        countryCode: 'NL',
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--country', 'nl']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Inc (${ORGANISATION_FOO.id}) updated
            Country:  FR (FRANCE) → NL (NETHERLANDS)
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Nantes',
            zipcode: '44000',
            country: 'NL',
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with no current country, should send a null country', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        country: null,
        countryCode: null,
      });
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        country: null,
        countryCode: null,
        billingEmail: 'accounting@example.com',
      });

      const result = await runClever(['orgs', 'update', 'Foo Inc', '--billing-email', 'accounting@example.com']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Inc (${ORGANISATION_FOO.id}) updated
            Billing email:  billing@example.com → accounting@example.com
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Nantes',
            zipcode: '44000',
            country: null,
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'accounting@example.com',
          },
        },
      ]);
    });

    it('with --company and --vat-number, should print the VAT number with its state', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        company: 'Foo SAS',
        VAT: 'FR12345678901',
        vatState: 'VALID',
      });

      const result = await runClever([
        'orgs',
        'update',
        ORGANISATION_FOO.id,
        '--company',
        'Foo SAS',
        '--vat-number',
        'FR12345678901',
      ]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Inc (${ORGANISATION_FOO.id}) updated
            Company:     - → Foo SAS
            VAT number:  - → FR12345678901 (VALID)
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Nantes',
            zipcode: '44000',
            country: 'FR',
            company: 'Foo SAS',
            VAT: 'FR12345678901',
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with an empty --company and an empty --vat-number, should clear both to switch to an individual', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        company: 'Foo SAS',
        VAT: 'FR12345678901',
        vatState: 'VALID',
      });
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--company', '', '--vat-number', '']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Inc (${ORGANISATION_FOO.id}) updated
            Company:     Foo SAS → -
            VAT number:  FR12345678901 (VALID) → -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Nantes',
            zipcode: '44000',
            country: 'FR',
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with an empty --address and an empty --country, should send them as null', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        address: null,
        country: null,
        countryCode: null,
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--address', '', '--country', '']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Organisation Foo Inc (${ORGANISATION_FOO.id}) updated
            Address:  34 rue de l'Exemple → -
            Country:  FR (FRANCE) → -
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: null,
            city: 'Nantes',
            zipcode: '44000',
            country: null,
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with the current values, should print that there is nothing to update and not send the update', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--city', 'Nantes']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `Nothing to update in Foo Inc (${ORGANISATION_FOO.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
      ]);
    });

    it('without any option, should print an error and call nothing', async () => {
      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id]);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] No option provided, nothing to update' });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with a --country of three letters, should print a usage error', async () => {
      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--country', 'FRA']);

      assertCleverResult(result, {
        exitCode: 1,
        usageError: 'country: Use a two-letter ISO country code (e.g.: FR)',
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with --vat-number and no company, should print an error before the update', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--vat-number', 'FR12345678901']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] --vat-number requires a company, set --company too',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
      ]);
    });

    it('with an empty --company while a VAT number remains, should print an error before the update', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, {
        ...ORGANISATION_FOO,
        company: 'Foo SAS',
        VAT: 'FR12345678901',
        vatState: 'VALID',
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--company', '']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] --vat-number requires a company, set --company too, or clear both with --company "" --vat-number ""',
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
      ]);
    });
  });

  describe('Environment errors', () => {
    it('with an update refused for a missing OAuth right, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 403, {
        id: 6102,
        type: 'error',
        message: 'You are not allowed to edit this organisation',
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--city', 'Paris']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot update Foo Inc (${ORGANISATION_FOO.id}): the OAuth right manage_organisations is missing`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Paris',
            zipcode: '44000',
            country: 'FR',
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with an update refused for the role, should print an error', async () => {
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'DEVELOPER' }] }),
      );
      await apiMock.respond('GET', `/v2/organisations/${ORGANISATION_FOO.id}`, 200, ORGANISATION_FOO);
      await apiMock.respond('PUT', `/v2/organisations/${ORGANISATION_FOO.id}`, 403, {
        id: 3000,
        type: 'error',
        message: 'Forbidden',
      });

      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--city', 'Paris']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot update Foo Inc (${ORGANISATION_FOO.id}): your role does not allow it`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}` },
        {
          method: 'PUT',
          path: `/v2/organisations/${ORGANISATION_FOO.id}`,
          body: {
            name: 'Foo Inc',
            description: 'Main organisation',
            address: "34 rue de l'Exemple",
            city: 'Paris',
            zipcode: '44000',
            country: 'FR',
            company: null,
            VAT: null,
            customerFullName: 'Marie Dubois',
            billingEmail: 'billing@example.com',
          },
        },
      ]);
    });

    it('with an empty --name, should print a usage error and call nothing', async () => {
      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--name', '']);

      assertCleverResult(result, { exitCode: 1, usageError: 'name: Cannot be empty' });
      assertApiCalls(await apiMock.getCalls(), []);
    });

    it('with an empty --description, should print a usage error and call nothing', async () => {
      const result = await runClever(['orgs', 'update', ORGANISATION_FOO.id, '--description', '']);

      assertCleverResult(result, { exitCode: 1, usageError: 'description: Cannot be empty' });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
