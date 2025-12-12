/**
 * @import { CcRequest, CcResponse } from '../../../../src/types/request.types.js'
 * @import { MockCtrl } from '../../../lib/mock-api/mock-ctrl.js'
 */
import { expect } from 'chai';
import * as hanbi from 'hanbi';
import { CcClientError, CcRequestError } from '../../../../src/lib/error/cc-client-errors.js';
import { HeadersBuilder } from '../../../../src/lib/request/headers-builder.js';
import { QueryParams } from '../../../../src/lib/request/query-params.js';
import { sendRequest as originalSendRequest } from '../../../../src/lib/request/request.js';
import { expectPromiseThrows } from '../../../lib/expect-utils.js';
import { mockTestHooks } from '../../../lib/mock-api/support/mock-test-hooks.js';

describe('request', () => {
  /** @type {MockCtrl} */
  let apiMockCtrl;

  const hooks = mockTestHooks();

  before(async () => {
    apiMockCtrl = await hooks.before();
  });
  beforeEach(hooks.beforeEach);
  afterEach(() => {
    hanbi.restore();
  });
  after(hooks.after);

  /**
   *
   * @param {Partial<CcRequest>} request
   * @returns {Promise<CcResponse<any>>}
   */
  async function sendRequest(request) {
    return originalSendRequest({
      cors: false,
      timeout: 0,
      cache: null,
      debug: false,
      method: 'GET',
      ...request,
      url: request.url.startsWith('http') ? request.url : `${apiMockCtrl.mockClient.baseUrl}${request.url}`,
    });
  }

  describe('sendRequest', () => {
    it('should successfully make a GET request', async () => {
      const responseBody = { data: 'test response' };

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'GET',
            url: `/api/test`,
            headers: new HeadersBuilder().acceptJson().build(),
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('GET');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.headers.accept).to.equal('application/json');
          expect(calls.first.response).to.deep.equal({ status: 200, body: responseBody });
        });
    });

    it('should make a GET request with query parameters', async () => {
      const queryParams = new QueryParams()
        .append('param1', 'value1')
        .append('param2', 'value2')
        .append('param2', 'value3');

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200 })
        .thenCall(() =>
          sendRequest({
            method: 'GET',
            url: `/api/test`,
            queryParams,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.queryParams.param1).to.equal('value1');
          expect(calls.first.queryParams.param2).to.deep.equal(['value2', 'value3']);
        });
    });

    it('should make a GET request with headers', async () => {
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200 })
        .thenCall(() =>
          sendRequest({
            method: 'GET',
            url: `/api/test`,
            headers: new HeadersBuilder().acceptJson().withHeader('x-custom', 'x-value').build(),
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.headers['x-custom']).to.equal('x-value');
        });
    });

    it('should successfully make a POST request with JSON body', async () => {
      const requestBody = { request: 'body' };
      const responseBody = { response: 'body' };

      await apiMockCtrl
        .mock()
        .when({ method: 'POST', path: '/api/test' })
        .respond({ status: 201, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'POST',
            url: `/api/test`,
            headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
            body: requestBody,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('POST');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.body).to.deep.equal(requestBody);
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.headers.accept).to.equal('application/json');
          expect(calls.first.headers['content-type']).to.equal('application/json');
          expect(calls.first.response).to.deep.equal({ status: 201, body: responseBody });
        });
    });

    it('should successfully make a POST request with string body', async () => {
      const requestBody = 'request body';
      const responseBody = { response: 'body' };

      await apiMockCtrl
        .mock()
        .when({ method: 'POST', path: '/api/test' })
        .respond({ status: 201, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'POST',
            url: `/api/test`,
            headers: new HeadersBuilder().contentTypeTextPlain().build(),
            body: requestBody,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('POST');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.body).to.deep.equal(requestBody);
          expect(calls.first.headers['content-type']).to.equal('text/plain');
          expect(calls.first.response).to.deep.equal({ status: 201, body: responseBody });
        });
    });

    it('should successfully make a PUT request with JSON body', async () => {
      const requestBody = { request: 'body' };
      const responseBody = { response: 'body' };

      await apiMockCtrl
        .mock()
        .when({ method: 'PUT', path: '/api/test' })
        .respond({ status: 200, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'PUT',
            url: `/api/test`,
            headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
            body: requestBody,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('PUT');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.body).to.deep.equal(requestBody);
          expect(calls.first.headers.accept).to.equal('application/json');
          expect(calls.first.headers['content-type']).to.equal('application/json');
          expect(calls.first.response).to.deep.equal({ status: 200, body: responseBody });
        });
    });

    it('should successfully make a PATCH request with JSON body', async () => {
      const requestBody = { request: 'body' };
      const responseBody = { response: 'body' };

      await apiMockCtrl
        .mock()
        .when({ method: 'PATCH', path: '/api/test' })
        .respond({ status: 200, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'PATCH',
            url: `/api/test`,
            headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
            body: requestBody,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('PATCH');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.body).to.deep.equal(requestBody);
          expect(calls.first.headers.accept).to.equal('application/json');
          expect(calls.first.headers['content-type']).to.equal('application/json');
          expect(calls.first.response).to.deep.equal({ status: 200, body: responseBody });
        });
    });

    it('should successfully make a DELETE request', async () => {
      await apiMockCtrl
        .mock()
        .when({ method: 'DELETE', path: '/api/test' })
        .respond({ status: 204 })
        .thenCall(() =>
          sendRequest({
            method: 'DELETE',
            url: `/api/test`,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('DELETE');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.response).to.deep.equal({ status: 204 });
        });
    });

    it('should successfully make a HEAD request', async () => {
      await apiMockCtrl
        .mock()
        .when({ method: 'HEAD', path: '/api/test' })
        .respond({ status: 200 })
        .thenCall(() =>
          sendRequest({
            method: 'HEAD',
            url: `/api/test`,
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.method).to.equal('HEAD');
          expect(calls.first.path).to.equal('/api/test');
          expect(calls.first.response).to.deep.equal({ status: 200 });
        });
    });

    it('should handle JSON response', async () => {
      const responseBody = { response: 'body' };

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/json' })
        .respond({ status: 200, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'GET',
            url: `/api/json`,
            headers: new HeadersBuilder().acceptJson().build(),
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.response).to.deep.equal({ status: 200, body: responseBody });
        });
    });

    it('should handle plain text response', async () => {
      const responseBody = 'response body';

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/json' })
        .respond({ status: 200, body: responseBody })
        .thenCall(() =>
          sendRequest({
            method: 'GET',
            url: `/api/json`,
            headers: new HeadersBuilder().acceptTextPlain().build(),
          }),
        )
        .verify((calls) => {
          expect(calls.count).to.equal(1);
          expect(calls.first.response).to.deep.equal({ status: 200, body: responseBody });
        });
    });

    it('should handle network errors', async () => {
      const stub = hanbi.stubMethod(globalThis, 'fetch');
      stub.callsFake(() => {
        throw new TypeError('Failed to fetch');
      });

      await expectPromiseThrows(
        sendRequest({
          method: 'GET',
          url: 'https://example.com/api/error',
        }),
        (error) => {
          expect(error).to.be.instanceOf(CcRequestError);
          expect(error.code).to.equal('NETWORK_ERROR');
          expect(error.message).to.include('A network error occurred');
        },
      );
    });

    it('should handle invalid URLs', async () => {
      await expectPromiseThrows(
        sendRequest({
          method: 'GET',
          url: 'http://:\\invalid-url',
        }),
        (error) => {
          expect(error).to.be.instanceOf(CcRequestError);
          expect(error.code).to.equal('INVALID_URL');
          expect(error.message).to.include('Invalid URL');
        },
      );
    });

    it('should handle unexpected errors', async () => {
      const stub = hanbi.stubMethod(globalThis, 'fetch');
      stub.callsFake(() => {
        throw new TypeError('Unexpected Test error');
      });

      await expectPromiseThrows(
        sendRequest({
          method: 'GET',
          url: 'https://example.com/api/error',
          headers: new HeadersBuilder().build(),
        }),
        (error) => {
          expect(error).to.be.instanceOf(CcRequestError);
          expect(error.code).to.equal('UNEXPECTED_ERROR');
          expect(error.message).to.include('An unexpected error occurred');
        },
      );
    });

    it('should set CORS mode when specified', async () => {
      await apiMockCtrl.mock().when({ method: 'GET', path: '/api/test' }).respond({ status: 201 });
      const spy = hanbi.spyMethod(globalThis, 'fetch').passThrough();

      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        cors: true,
      });

      expect(spy.lastCall.args[1].mode).to.equal('cors');
    });
  });

  describe('cache', () => {
    it('should use cached response', async () => {
      const responseBody = { data: 'test response' };
      await apiMockCtrl.mock().when({ method: 'GET', path: '/api/test' }).respond({ status: 200, body: responseBody });
      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { ttl: 1000 },
      });

      const spy = hanbi.spyMethod(globalThis, 'fetch').passThrough();

      const response = await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { ttl: 1000 },
      });

      expect(spy.callCount).to.equal(0);
      expect(response.body).to.deep.equal(responseBody);
    });

    it('should not use cached response', async () => {
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200, body: { data: 'test response' } });
      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { ttl: 1000 },
      });

      const spy = hanbi.spyMethod(globalThis, 'fetch').passThrough();

      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: null,
      });

      expect(spy.callCount).to.equal(1);
    });

    it('should reload cached response', async () => {
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200, body: { data: 'test response' } });
      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { ttl: 1000 },
      });

      const newResponseBody = { data: 'fresh new test response' };
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/api/test' })
        .respond({ status: 200, body: newResponseBody });
      const spy = hanbi.spyMethod(globalThis, 'fetch').passThrough();

      const response = await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { mode: 'reload', ttl: 1000 },
      });

      expect(spy.callCount).to.equal(1);
      expect(response.body).to.deep.equal(newResponseBody);

      spy.reset();
      const response2 = await sendRequest({
        method: 'GET',
        url: `/api/test`,
        headers: new HeadersBuilder().acceptJson().build(),
        cache: { ttl: 1000 },
      });
      expect(spy.callCount).to.equal(0);
      expect(response2.body).to.deep.equal(newResponseBody);
    });
  });

  describe('timeout', () => {
    it('should timeout', async function () {
      this.timeout(50);

      await apiMockCtrl.mock().when({ method: 'GET', path: '/api/test' }).respond({ status: 200 }, 20);

      await expectPromiseThrows(
        sendRequest({
          method: 'GET',
          url: `/api/test`,
          timeout: 10,
        }),
        (error) => {
          expect(error).to.be.instanceOf(CcClientError);
          expect(error.code).to.equal('TIMEOUT_EXCEEDED');
          expect(error.message).to.include(`Timeout of 10 ms exceeded`);
        },
      );
    });

    it('should not timeout', async function () {
      this.timeout(50);

      await apiMockCtrl.mock().when({ method: 'GET', path: '/api/test' }).respond({ status: 200 }, 20);

      await sendRequest({
        method: 'GET',
        url: `/api/test`,
        timeout: 50,
      });
    });
  });
});
