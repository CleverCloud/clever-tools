/**
 * @import { CcRequest } from '../../../../src/types/request.types.js'
 * @import { MockCtrl } from '../../../lib/mock-api/mock-ctrl.js'
 * @import { MockSseEvent } from '../../../lib/mock-api/mock-api.types.js'
 * @import { CcStreamConfig } from '../../../../src/lib/stream/cc-stream.types.js'
 * @import { SpiedStream, Stubs } from './cc-stream.spec.types.js'
 */

import { expect } from 'chai';
import * as hanbi from 'hanbi';
import { CcClientError, CcHttpError } from '../../../../src/lib/error/cc-client-errors.js';
import { HeadersBuilder } from '../../../../src/lib/request/headers-builder.js';
import { QueryParams } from '../../../../src/lib/request/query-params.js';
import { requestWithCache } from '../../../../src/lib/request/request-with-cache.js';
import { CcStream } from '../../../../src/lib/stream/cc-stream.js';
import { mockTestHooks } from '../../../lib/mock-api/support/mock-test-hooks.js';
import { sleep } from '../../../lib/timers.js';

/** @type {MockSseEvent} */
const END_OF_STREAM = { type: 'message', event: 'END_OF_STREAM', data: { endedBy: 'UNTIL_REACHED' } };
/** @type {MockSseEvent} */
const HEARTBEAT = { type: 'message', event: 'HEARTBEAT' };
/** @type {MockSseEvent} */
const CLOSE_STREAM = { type: 'close' };
/** @type {MockSseEvent} */
const MESSAGE = { type: 'message', event: 'EVENT', data: 'hello' };

const RETRY = { maxRetryCount: 2, initRetryTimeout: 10, backoffFactor: 1 };

describe('cc-stream', () => {
  /** @type {MockCtrl} */
  let apiMockCtrl;

  /** @type {() => void | null} */
  let cleanStream;

  const hooks = mockTestHooks();

  before(async () => {
    apiMockCtrl = await hooks.before();
  });
  beforeEach(hooks.beforeEach);
  afterEach(() => {
    hanbi.restore();
    cleanStream?.();
  });
  after(hooks.after);

  /**
   * @param {Partial<CcRequest>} request
   * @param {Partial<CcStreamConfig>} config
   * @returns {SpiedStream}
   */
  function createAndSpyStream(request, config = {}) {
    cleanStream?.();

    /** @type {Stubs} */
    const stubs = {
      request: hanbi.spy().passThrough(),
      open: hanbi.spy().passThrough(),
      error: hanbi.spy().passThrough(),
      event: hanbi.spy().passThrough(),
      success: hanbi.spy().passThrough(),
      failure: hanbi.spy().passThrough(),
    };

    const stream = new CcStream(
      () => {
        stubs.request.handler();
        return {
          cors: false,
          timeout: 0,
          cache: null,
          debug: false,
          method: 'GET',
          ...request,
          url: request.url.startsWith('http') ? request.url : `${apiMockCtrl.mockClient.baseUrl}${request.url}`,
        };
      },
      {
        retry: null,
        debug: false,
        heartbeatPeriod: 20,
        healthcheckInterval: 10,
        ...config,
      },
    );

    cleanStream = () => {
      cleanStream = null;
      stream.close({ type: 'END_OF_TEST' });
    };

    stream
      .onOpen(stubs.open.handler)
      .onError(stubs.error.handler)
      .on('EVENT', (evt) => stubs.event.handler(evt.data));

    return {
      stream,
      async start() {
        try {
          const result = await stream.start();
          stubs.success.handler(result);
          return result;
        } catch (e) {
          stubs.failure.handler(e);
          throw e;
        }
      },
      close(reason) {
        stream.close(reason);
      },
      async verifyCounts(expectedCounts, maxWait = 0) {
        const startTimestamp = Date.now();

        while (true) {
          try {
            const currentCounts = Object.fromEntries(
              Object.entries(stubs)
                .filter(([key]) => key in expectedCounts)
                .map(([key, stub]) => [key, stub.callCount]),
            );
            expect(currentCounts).to.deep.equal(expectedCounts);
            return;
          } catch (e) {
            if (e instanceof Error && e.name === 'AssertionError') {
              const duration = Date.now() - startTimestamp;
              if (maxWait <= 0 || duration >= maxWait) {
                throw e;
              } else {
                await sleep(3);
              }
            } else {
              throw e;
            }
          }
        }
      },
      stubs,
    };
  }

  it('starting stream should call the request factory', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });

    spiedStream.start();

    await spiedStream.verifyCounts({ request: 1 });
  });

  it('GET request should open stream', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [END_OF_STREAM],
        delayBetween: 10,
      });

    await spiedStream.start();

    await spiedStream.verifyCounts({ open: 1 });
  });

  it('POST request should open stream', async () => {
    const spiedStream = createAndSpyStream({ method: 'POST', url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({
        status: 200,
        events: [END_OF_STREAM],
        delayBetween: 10,
      });

    await spiedStream.start();

    await spiedStream.verifyCounts({ open: 1 });
  });

  it('should run expected Http request', async () => {
    const spiedStream = createAndSpyStream({
      method: 'POST',
      url: '/',
      body: 'body',
      headers: new HeadersBuilder().contentTypeTextPlain().withHeader('x-header', 'x-value').build(),
      queryParams: new QueryParams().append('param1', 'value1').append('param2', 'value2'),
    });
    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({
        status: 200,
        events: [END_OF_STREAM],
        delayBetween: 10,
      })
      .thenCall(() => spiedStream.start())
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.method).to.equal('POST');
        expect(calls.first.path).to.equal('/');
        expect(calls.first.headers.accept).to.equal('text/event-stream');
        expect(calls.first.headers['content-type']).to.equal('text/plain');
        expect(calls.first.headers['x-header']).to.equal('x-value');
        expect(calls.first.queryParams).to.deep.equal({ param1: 'value1', param2: 'value2' });
      });

    await spiedStream.verifyCounts({ open: 1 });
  });

  it('should override accept header and cache config', async () => {
    // fake caching request response
    await requestWithCache(
      {
        method: 'GET',
        url: `${apiMockCtrl.mockClient.baseUrl}/`,
        headers: new HeadersBuilder().acceptEventStream().build(),
        cache: { ttl: 100 },
        cors: false,
        timeout: 0,
        debug: false,
      },
      () =>
        Promise.resolve({
          status: 200,
          headers: null,
          body: null,
          requestDuration: 0,
          cacheHit: false,
        }),
    );

    const spiedStream = createAndSpyStream({
      method: 'GET',
      url: '/',
      headers: new HeadersBuilder().acceptJson().build(),
      // cache should not be used even if we ask so
      cache: { ttl: 100 },
    });

    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [END_OF_STREAM],
        delayBetween: 10,
      })
      .thenCall(() => spiedStream.start())
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.headers.accept).to.equal('text/event-stream');
      });

    await spiedStream.verifyCounts({ open: 1 });
  });

  it('unknown url should lead to failure with CcHttpError', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });

    spiedStream.start();

    await spiedStream.verifyCounts({ failure: 1 }, 20);
    expect(spiedStream.stubs.failure.firstCall.args[0]).to.be.instanceof(CcHttpError);
  });

  it('non 200 status code should lead to failure with CcHttpError', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl.mock().when({ method: 'GET', path: '/' }).respond({
      status: 400,
      body: 'invalid request',
    });

    spiedStream.start();

    await spiedStream.verifyCounts({ failure: 1 }, 20);
    expect(spiedStream.stubs.failure.firstCall.args[0]).to.be.instanceof(CcHttpError);
  });

  it('invalid response content type should lead to failure with CcClientError', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl.mock().when({ method: 'GET', path: '/' }).respond({
      status: 200,
      body: 'invalid content type',
    });

    spiedStream.start();

    await spiedStream.verifyCounts({ failure: 1 }, 20);
    expect(spiedStream.stubs.failure.firstCall.args[0]).to.be.instanceof(CcClientError);
    expect(spiedStream.stubs.failure.firstCall.args[0].code).to.equal('SSE_INVALID_CONTENT_TYPE');
  });

  it('receiving END_OF_STREAM event should close stream properly', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [END_OF_STREAM, CLOSE_STREAM],
        delayBetween: 10,
      });

    const result = await spiedStream.start();

    await spiedStream.verifyCounts({ success: 1, failure: 0 });
    expect(result).to.deep.equal({ type: 'UNTIL_REACHED' });
  });

  it('should receive all events and close properly after END_OF_STREAM event', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [
          { type: 'message', event: 'EVENT', data: 'hello John' },
          { type: 'message', event: 'EVENT', data: 'hello Jack' },
          { type: 'message', event: 'EVENT', data: 'hello Mary' },
          END_OF_STREAM,
        ],
        delayBetween: 10,
      });

    const result = await spiedStream.start();

    await spiedStream.verifyCounts({ event: 3, success: 1 });
    expect(result).to.deep.equal({ type: 'UNTIL_REACHED' });
    expect(spiedStream.stubs.event.getCall(0).args[0]).to.equal('hello John');
    expect(spiedStream.stubs.event.getCall(1).args[0]).to.equal('hello Jack');
    expect(spiedStream.stubs.event.getCall(2).args[0]).to.equal('hello Mary');
  });

  it('receiving heartbeat and events should not timeout', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [
          HEARTBEAT,
          { type: 'message', event: 'EVENT', data: 'hello world' },
          { type: 'message', event: 'EVENT', data: 'hello world' },
          { type: 'message', event: 'EVENT', data: 'hello world' },
          { type: 'message', event: 'EVENT', data: 'hello world' },
          { type: 'message', event: 'EVENT', data: 'hello world' },
          HEARTBEAT,
          HEARTBEAT,
          HEARTBEAT,
          HEARTBEAT,
          END_OF_STREAM,
        ],
        delayBetween: 10,
      });

    await spiedStream.start();

    await spiedStream.verifyCounts({ open: 1, error: 0, event: 5, failure: 0 });
  });

  it('pause stream should not timeout', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [HEARTBEAT],
        delayBetween: 10,
      });
    spiedStream.start();
    await spiedStream.verifyCounts({ open: 1, error: 0, event: 0, failure: 0 }, 20);

    spiedStream.stream.pause();
    await sleep(100);

    await spiedStream.verifyCounts({ open: 1, error: 0, event: 0, failure: 0 });
  });

  it('resume stream should run request with last event ID header', async () => {
    const spiedStream = createAndSpyStream({ url: '/' });
    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({
        status: 200,
        events: [
          { type: 'message', event: 'EVENT', id: '210041493:43875:0' },
          { type: 'message', event: 'EVENT', id: '210041493:43875:1' },
          { type: 'message', event: 'EVENT', id: '210041493:43875:2' },
        ],
        delayBetween: 10,
      })
      .thenCall(async () => {
        spiedStream.start();
        // make sure the 3 events have been processed
        await spiedStream.verifyCounts({ event: 3 }, 50);
        spiedStream.stream.pause();
        await sleep(20);
        spiedStream.stream.resume();
        // make sure the re-open has been done avec resume
        await spiedStream.verifyCounts({ open: 2 }, 20);
      })
      .verify((calls) => {
        expect(calls.first.headers).to.not.ownProperty('last-event-id');
        expect(calls.last.headers['last-event-id']).to.equal('210041493:43875:2');
      });
  });

  describe('without retry', () => {
    it('no more heartbeat should lead to failure without retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 200,
          events: [HEARTBEAT],
          delayBetween: 10,
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 1, error: 0, failure: 1 }, 50);
      expect(spiedStream.stubs.failure.getCall(0).args[0].code).to.equal('SSE_HEALTH_ERROR');
    });

    it('connection closed by server should lead to a failure without retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 200,
          events: [{ type: 'message', event: 'EVENT', data: 'hello world' }, CLOSE_STREAM],
          delayBetween: 10,
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 1, error: 0, failure: 1 }, 50);
      expect(spiedStream.stubs.failure.getCall(0).args[0].code).to.equal('SSE_SERVER_ERROR');
    });
  });

  describe('with retry', () => {
    it('400 status code should lead to failure without retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 400,
          body: { message: '400' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 0, failure: 1 }, 50);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('401 status code should lead to failure without retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 401,
          body: { message: '401' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 0, failure: 1 }, 50);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('403 status code should lead to failure without retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 403,
          body: { message: '403' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 0, failure: 1 }, 50);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('500 status code should lead to failure with retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 500,
          body: { message: '500' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 2, failure: 1 }, 150);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('408 status code should lead to failure with retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 408,
          body: { message: '408' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 2, failure: 1 }, 150);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('429 status code should lead to failure with retry', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 429,
          body: { message: '429' },
        });

      spiedStream.start();

      await spiedStream.verifyCounts({ open: 0, error: 2, failure: 1 }, 150);
      expect(spiedStream.stubs.failure.getCall(0).args[0]).to.be.instanceof(CcHttpError);
    });

    it('[error 500 + error 500 + events] should be retried and succeed', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 500,
          body: { message: '500' },
        });

      spiedStream.start();

      // 1rst attempt (error 500) => error++
      await spiedStream.verifyCounts({ open: 0, error: 1 }, 40);

      // 1rst retry (error 500) => error++
      await spiedStream.verifyCounts({ open: 0, error: 2 }, 40);

      // 2nd retry (events) => open++ & event+=1 (& success because END_OF_STREAM)
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 200,
          events: [MESSAGE, END_OF_STREAM],
          delayBetween: 10,
        });

      await spiedStream.verifyCounts({ open: 1, error: 2, failure: 0, success: 1 }, 40);
    });

    it('[events + timeout + events] should be retried and succeed', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 200,
          events: [MESSAGE, MESSAGE],
          delayBetween: 10,
        });

      spiedStream.start();

      // 1rst attempt (events) => open++ & event+=2
      await spiedStream.verifyCounts({ open: 1, event: 2 }, 40);

      // 1rst retry (timeout) => error++
      await spiedStream.verifyCounts({ open: 1, event: 2, error: 1 }, 60);

      // 2nd retry (events) => open++ & event+=2
      await spiedStream.verifyCounts({ open: 2, event: 4, error: 1 }, 60);
    });

    it('[success + timeout + error 500 + error 500] should be retried and fail', async () => {
      const spiedStream = createAndSpyStream({ url: '/' }, { retry: RETRY });
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 200,
          events: [MESSAGE, MESSAGE],
          delayBetween: 10,
        });

      spiedStream.start();

      // 1rst attempt (events) => open++ & event+=2
      await spiedStream.verifyCounts({ open: 1, event: 2, error: 0 }, 40);

      // 1rst retry (timeout) => error++
      await spiedStream.verifyCounts({ open: 1, event: 2, error: 1 }, 60);

      // 2nd retry (error 500) => error++ & failure
      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/' })
        .respond({
          status: 500,
          body: { message: '500' },
        });
      await spiedStream.verifyCounts({ open: 1, event: 2, error: 2, failure: 1 }, 60);
    });
  });
});
