import { doublureHooks } from '@clevercloud/doublure/testing';
import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { runCli } from '../../../test/cli-runner.js';

describe('emails command', () => {
  const hooks = doublureHooks();
  let mockCtrl;

  before(async () => {
    mockCtrl = await hooks.before();
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  it('should return primary email addresses', async () => {
    await mockCtrl
      .mock()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({
        status: 200,
        body: {
          id: 'user_00000000-0000-0000-0000-000000000001',
          email: 'test.user@example.com',
          name: 'Test User',
          phone: '+33600000000',
          address: '1 rue de Test',
          city: 'Paris',
          zipcode: '75001',
          country: 'FRANCE',
          avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000.jpg',
          creationDate: 1700000000000,
          lang: 'EN',
          emailValidated: true,
          oauthApps: ['github'],
          admin: false,
          canPay: true,
          preferredMFA: 'TOTP',
          hasPassword: true,
          partnerId: '00000000-0000-0000-0000-000000000000',
          partnerName: 'default',
          partnerConsoleUrl: 'https://console.clever-cloud.com',
        },
      })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: [] })
      .thenCall(async () => {
        const result = await runCli(['emails'], {
          env: { API_HOST: mockCtrl.mockClient.baseUrl },
        });

        assert.strictEqual(
          result.stdout,
          dedent`
            ✉️  Primary email address:
             • test.user@example.com
          `,
        );
      })
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
      });
  });

  it('should return primary and secondary email addresses', async () => {
    await mockCtrl
      .mock()
      .when({ method: 'GET', path: '/v2/self' })
      .respond({
        status: 200,
        body: {
          id: 'user_00000000-0000-0000-0000-000000000001',
          email: 'test.user@example.com',
          name: 'Test User',
          phone: '+33600000000',
          address: '1 rue de Test',
          city: 'Paris',
          zipcode: '75001',
          country: 'FRANCE',
          avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000.jpg',
          creationDate: 1700000000000,
          lang: 'EN',
          emailValidated: true,
          oauthApps: ['github'],
          admin: false,
          canPay: true,
          preferredMFA: 'TOTP',
          hasPassword: true,
          partnerId: '00000000-0000-0000-0000-000000000000',
          partnerName: 'default',
          partnerConsoleUrl: 'https://console.clever-cloud.com',
        },
      })
      .when({ method: 'GET', path: '/v2/self/emails' })
      .respond({ status: 200, body: ['test.user+secondary@example.com'] })
      .thenCall(async () => {
        const result = await runCli(['emails'], {
          env: { API_HOST: mockCtrl.mockClient.baseUrl },
        });

        assert.strictEqual(
          result.stdout,
          dedent`
            ✉️  Primary email address:
             • test.user@example.com

            ✉️  1 secondary email address(es):
             • test.user+secondary@example.com
          `,
        );
      })
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
      });
  });

  it('should fail', async () => {
    await mockCtrl
      .mock()
      .when({ method: 'PUT', path: `/v2/self/emails/${encodeURIComponent('test.user@example.com')}` })
      .respond({ status: 400, body: { id: 101 } })
      .thenCall(async () => {
        const result = await runCli(['emails', 'add', 'test.user@example.com'], {
          env: { API_HOST: mockCtrl.mockClient.baseUrl },
          expectExitCode: 1,
        });

        assert.strictEqual(result.stderr, `[ERROR] This address already belongs to your account`);
      })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });
  });
});
