import dedent from 'dedent';
import * as assert from 'node:assert';
import { after, afterEach, before, describe, it } from 'node:test';
import { runCli } from '../../../test/lib/cli-runner.js';
import { MockCtrl } from '../../../test/lib/mock-api/mock-ctrl.js';
import { mockStart } from '../../../test/lib/mock-api/mock-start.js';

describe('emails command', () => {
  let apiMockCtrl: MockCtrl;
  let stopServer: () => Promise<void>;

  before(async () => {
    const mockServer = await mockStart();
    stopServer = mockServer.stop;
    apiMockCtrl = mockServer.ctrl;
  });

  after(async () => {
    await stopServer();
  });

  afterEach(async () => {
    await apiMockCtrl.mockClient.reset();
  });

  it('should return primary email addresses', async () => {
    console.log(apiMockCtrl.mockClient.baseUrl);

    await apiMockCtrl
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
          env: { API_HOST: apiMockCtrl.mockClient.baseUrl },
        });

        console.log('stdout:', result.stdout);

        assert.strictEqual(
          result.stdout,
          dedent`
            ✉️  Primary email address:
             • test.user@example.com
          `,
        );

        console.log('stderr:', result.stderr);
        console.log('exitCode:', result.exitCode);
      })
      .verify((calls) => {
        // console.log(calls.calls);
        assert.strictEqual(calls.count, 2);
      });
  });

  it('should return primary and secondary email addresses', async () => {
    console.log(apiMockCtrl.mockClient.baseUrl);

    await apiMockCtrl
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
          env: { API_HOST: apiMockCtrl.mockClient.baseUrl },
        });

        console.log('stdout:', result.stdout);

        assert.strictEqual(
          result.stdout,
          dedent`
            ✉️  Primary email address:
             • test.user@example.com
            
            ✉️  1 secondary email address(es):
             • test.user+secondary@example.com
          `,
        );

        console.log('stderr:', result.stderr);
        console.log('exitCode:', result.exitCode);
      })
      .verify((calls) => {
        // console.log(calls.calls);
        assert.strictEqual(calls.count, 2);
      });
  });
});
