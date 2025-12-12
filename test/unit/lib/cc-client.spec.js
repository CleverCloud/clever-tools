/**
 * @import { CcRequestParams } from '../../../src/types/request.types.js'
 * @import { CcClientConfig } from '../../../src/types/client.types.js'
 * @import { OnRequestHook } from '../../../src/types/hook.types.js'
 * @import { MockCtrl } from '../../lib/mock-api/mock-ctrl.js'
 */
import { expect } from 'chai';
import * as hanbi from 'hanbi';
import { CcAuthApiToken } from '../../../src/lib/auth/cc-auth-api-token.js';
import { CcAuth } from '../../../src/lib/auth/cc-auth.js';
import { CcClient } from '../../../src/lib/cc-client.js';
import { CompositeCommand, SimpleCommand } from '../../../src/lib/command/command.js';
import { CcHttpError } from '../../../src/lib/error/cc-client-errors.js';
import { GetUrl } from '../../../src/lib/get-url.js';
import { HeadersBuilder } from '../../../src/lib/request/headers-builder.js';
import { QueryParams } from '../../../src/lib/request/query-params.js';
import { get, post } from '../../../src/lib/request/request-params-builder.js';
import { CcStream } from '../../../src/lib/stream/cc-stream.js';
import { StreamCommand } from '../../../src/lib/stream/stream-command.js';
import { expectPromiseThrows } from '../../lib/expect-utils.js';
import { mockTestHooks } from '../../lib/mock-api/support/mock-test-hooks.js';

/**
 * @extends {SimpleCommand<'test', any, any>}
 * @abstract
 */
export class TestSimpleCommand extends SimpleCommand {}

/**
 * @extends {CompositeCommand<'test', any, any>}
 * @abstract
 */
export class TestCompositeCommand extends CompositeCommand {}

/**
 * @extends {GetUrl<'test', any>}
 * @abstract
 */
export class TestGetUrl extends GetUrl {}

/**
 * @extends {StreamCommand<'test', any, CcStream>}
 * @abstract
 */
export class TestStreamCommand extends StreamCommand {
  /** @type {StreamCommand<'test', any, CcStream>['createStream']} */
  createStream(requestFactory, config) {
    return new CcStream(requestFactory, config);
  }
}

/**
 * @param {Partial<CcRequestParams>} requestsParams
 * @returns {TestSimpleCommand}
 */
function simpleCommand(requestsParams) {
  return new (class MyCommand extends TestSimpleCommand {
    toRequestParams() {
      return requestsParams;
    }
  })();
}

/**
 * @param {any} result
 * @returns {TestCompositeCommand}
 */
function compositeCommand(result) {
  return new (class MyCommand extends TestCompositeCommand {
    async compose() {
      return result;
    }
  })();
}

/**
 * @param {string} result
 */
function getUrl(result) {
  return new (class MyGetUrl extends TestGetUrl {
    get() {
      return result;
    }
  })();
}

/**
 * @param {Partial<CcRequestParams>} requestsParams
 * @returns {TestStreamCommand}
 */
function streamCommand(requestsParams) {
  return new (class MyCommand extends TestStreamCommand {
    toRequestParams() {
      return requestsParams;
    }
  })();
}

/**
 * This client is here just to make all protected methods public so that hanbi can mock or spy those methods.
 * @extends {CcClient<'test'>}
 */
class SpiedClient extends CcClient {
  /** @type {CcClient<'test'>['_transformCommandParams']} */
  async _transformCommandParams(command, _requestConfig) {
    return super._transformCommandParams(command, _requestConfig);
  }
  /** @type {CcClient<'test'>['_transformStreamParams']} */
  async _transformStreamParams(command, _requestConfig) {
    return super._transformStreamParams(command, _requestConfig);
  }
  /** @type {CcClient<'test'>['_compose']} */
  async _compose(command, requestConfig) {
    return super._compose(command, requestConfig);
  }
  /** @type {CcClient<'test'>['_getCommandRequestParams']} */
  async _getCommandRequestParams(command, requestConfig) {
    return super._getCommandRequestParams(command, requestConfig);
  }
  /** @type {CcClient<'test'>['_prepareRequest']} */
  async _prepareRequest(requestParams, requestConfig) {
    return super._prepareRequest(requestParams, requestConfig);
  }
  /** @type {CcClient<'test'>['_handleResponse']} */
  async _handleResponse(response, request, command) {
    return super._handleResponse(response, request, command);
  }
}

describe('clever-client', () => {
  /** @type {SpiedClient} */
  let client;
  /** @type {MockCtrl} */
  let apiMockCtrl;
  /** @type {() => void} */
  let closeStream;

  const hooks = mockTestHooks();

  /**
   * @param {Omit<CcClientConfig, 'baseUrl'>} [config]
   * @param {CcAuth|null} [auth]
   * @returns {SpiedClient}
   */
  function createClient(config, auth) {
    return new SpiedClient({ ...config, baseUrl: apiMockCtrl.mockClient.baseUrl }, auth);
  }

  /**
   * @param {CcStream} stream
   */
  function startStream(stream) {
    const result = stream.start();
    closeStream = () => {
      stream.close();
    };
    return result;
  }

  before(async () => {
    apiMockCtrl = await hooks.before();
    client = createClient();
  });
  beforeEach(hooks.beforeEach);
  afterEach(() => {
    hanbi.restore();
    closeStream?.();
  });
  after(hooks.after);

  describe('simple command', () => {
    it('should call `_transformCommandParams` method with right params', async () => {
      const spy = hanbi.stubMethod(client, '_transformCommandParams').passThrough();
      const command = simpleCommand(get('/path/subPath'));

      const requestConfig = {};

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'hello' })
        .thenCall(() => client.send(command, requestConfig));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(command);
      expect(spy.firstCall.args[1]).to.equal(requestConfig);
    });

    it('should call `_getCommandRequestParams` method with right params', async () => {
      const spy = hanbi.spyMethod(client, '_getCommandRequestParams').passThrough();
      const command = simpleCommand(get('/path/subPath'));

      const requestConfig = {};

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command, requestConfig));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(command);
      expect(spy.firstCall.args[1]).to.equal(requestConfig);
    });

    it('should call `_prepareRequest` method with right params', async () => {
      const spy = hanbi.spyMethod(client, '_prepareRequest').passThrough();
      const command = simpleCommand(get('/path/subPath'));
      const requestConfig = {};

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command, requestConfig));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0].method).to.equal('GET');
      expect(spy.firstCall.args[0].url).to.equal('/path/subPath');
      expect(spy.firstCall.args[1]).to.equal(requestConfig);
    });

    it('should call `command.toRequestParams` method with the transformed params', async () => {
      const transformedParams = { transformed: 'params' };
      hanbi.stubMethod(client, '_transformCommandParams').returns(Promise.resolve(transformedParams));

      const command = simpleCommand(get('/path/subPath'));
      const spy = hanbi.spyMethod(command, 'toRequestParams').passThrough();

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(transformedParams);
    });

    it('should call `auth.applyOnRequestParams()`', async () => {
      const auth = new CcAuthApiToken('token');
      const spy = hanbi.spyMethod(auth, 'applyOnRequestParams').passThrough();
      const client = createClient({}, auth);
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0].method).to.equal('GET');
      expect(spy.firstCall.args[0].url).to.equal('/path/subPath');
    });

    it('should call onRequest hook function', async () => {
      const spy = hanbi.stub((o) => o);
      spy.passThrough();
      const client = createClient({
        hooks: {
          onRequest: spy.handler,
        },
      });
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0].method).to.equal('GET');
      expect(spy.firstCall.args[0].url).to.equal('/path/subPath');
      expect(spy.firstCall.args[0].headers).to.not.equal(null);
      expect(spy.firstCall.args[0].headers).to.not.equal(undefined);
      expect(spy.firstCall.args[0].queryParams).to.not.equal(null);
      expect(spy.firstCall.args[0].queryParams).to.not.equal(undefined);
    });

    it('should merge prepared request params from onRequest hook', async () => {
      /** @type {OnRequestHook} */
      const onRequest = (request) => {
        request.queryParams.set('hook', 'hook');
      };

      const client = createClient({ hooks: { onRequest } });
      const spy = hanbi.spyMethod(client, '_prepareRequest').passThrough();
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      const result = await spy.firstCall.returnValue;

      expect(result.queryParams.get('hook')).to.equal('hook');
    });

    it('should prepend url with baseUrl', async () => {
      const spy = hanbi.spyMethod(client, '_prepareRequest').passThrough();
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200 })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      const result = await spy.firstCall.returnValue;
      expect(result.url).to.equal(`${apiMockCtrl.mockClient.baseUrl}/path/subPath`);
    });

    it('should call `_handleResponse` with right parameters', async () => {
      const spy = hanbi.spyMethod(client, '_handleResponse').passThrough();
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'body' })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0].body).to.equal('body');
      expect(spy.firstCall.args[0].status).to.equal(200);
      expect(spy.firstCall.args[1].method).to.equal('GET');
      expect(spy.firstCall.args[1].url).to.equal(`${apiMockCtrl.mockClient.baseUrl}/path/subPath`);
      expect(spy.firstCall.args[2]).to.equal(command);
    });

    it('should call `onResponse` hook with right parameters', async () => {
      const spy = hanbi.spy();
      const client = createClient({ hooks: { onResponse: spy.handler } });

      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'body' })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0].body).to.equal('body');
      expect(spy.firstCall.args[0].status).to.equal(200);
      expect(spy.firstCall.args[1].method).to.equal('GET');
      expect(spy.firstCall.args[1].url).to.equal(`${apiMockCtrl.mockClient.baseUrl}/path/subPath`);
    });

    it('should return `command.getEmptyResponse` when `getEmptyResponse.getEmptyResponsePolicy` returns an empty response', async () => {
      const spy = hanbi.spyMethod(client, 'send').passThrough();
      const command = simpleCommand(get('/path/subPath'));
      hanbi.stubMethod(command, 'getEmptyResponsePolicy').returns({ isEmpty: true, emptyValue: 'empty response' });

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'body' })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(await spy.firstCall.returnValue).to.equal('empty response');
    });

    it('should call `command.transformCommandOutput` with right parameters', async () => {
      const command = simpleCommand(get('/path/subPath'));
      const spy = hanbi.spyMethod(command, 'transformCommandOutput').passThrough();

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'body' })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal('body');
    });

    it('should return `command.transformCommandOutput`', async () => {
      const spy = hanbi.spyMethod(client, 'send').passThrough();
      const command = simpleCommand(get('/path/subPath'));
      hanbi.stubMethod(command, 'transformCommandOutput').returns('transformed response');

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 200, body: 'body' })
        .thenCall(() => client.send(command));

      expect(spy.callCount).to.equal(1);
      expect(await spy.firstCall.returnValue).to.equal('transformed response');
    });

    it('should throw `CcHttpError` when API returns error status', async () => {
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 500, body: 'A server error occurred' });

      await expectPromiseThrows(client.send(command), (err) => {
        expect(err).to.be.instanceOf(CcHttpError);
        expect(err.response.status).to.equal(500);
        expect(err.response.body).to.equal('A server error occurred');
      });
    });

    it('should call `onError` hook when API returns error status', async () => {
      const spy = hanbi.spy();
      const client = createClient({ hooks: { onError: spy.handler } });
      const command = simpleCommand(get('/path/subPath'));

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({ status: 500, body: 'A server error occurred' });

      await expectPromiseThrows(client.send(command), (err) => {
        expect(spy.callCount).to.equal(1);
        expect(spy.firstCall.args[0]).to.equal(err);
      });
    });
  });

  describe('composite command', () => {
    it('should call `_compose` method with right params', async () => {
      const spy = hanbi.spyMethod(client, '_compose').passThrough();
      const command = compositeCommand('command result');
      const requestConfig = {};

      await client.send(command, requestConfig);

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(command);
      expect(spy.firstCall.args[1]).to.equal(requestConfig);
    });

    it('should call `_transformCommandParams` method with right params', async () => {
      const spy = hanbi.spyMethod(client, '_transformCommandParams').passThrough();
      const command = compositeCommand('command result');
      const requestConfig = {};

      await client.send(command, requestConfig);

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(command);
      expect(spy.firstCall.args[1]).to.equal(requestConfig);
    });

    it('should call `command.compose` method with right params', async () => {
      const transformedParams = { transformed: 'params' };
      hanbi.stubMethod(client, '_transformCommandParams').returns(Promise.resolve(transformedParams));
      const command = compositeCommand('command result');
      const spy = hanbi.spyMethod(command, 'compose').passThrough();

      await client.send(command);

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(transformedParams);
    });

    it('composer should merge request config with initial request config', async () => {
      const command = new (class MyCommand extends TestCompositeCommand {
        /** @type {CompositeCommand<'test', ?, ?>['compose']} */
        async compose(_params, composer) {
          composer.send(simpleCommand(get('/path/subPath')), { cors: true, cache: { ttl: 100 }, timeout: 1000 });
          return 'result';
        }
      })();
      const spy = hanbi.spyMethod(client, 'send').passThrough();
      await apiMockCtrl.mock().when({ method: 'GET', path: '/path/subPath' }).respond({ status: 200, body: 'body' });

      await client.send(command, { cors: false, cache: { mode: 'reload', ttl: 500 }, debug: true });

      expect(spy.callCount).to.equal(2);
      expect(spy.lastCall.args[1]).to.deep.equal({
        cache: { mode: 'reload', ttl: 100 },
        cors: true,
        timeout: 1000,
        debug: true,
      });
    });
  });

  describe('get url', () => {
    it('should call `get` method', async () => {
      const gu = getUrl('example');
      const spy = hanbi.spyMethod(gu, 'get').passThrough();

      client.getUrl(gu);

      expect(spy.callCount).to.equal(1);
    });

    it('should construct the right url', async () => {
      const gu = getUrl('example');

      const url = client.getUrl(gu);

      expect(url.toString()).to.equal(`${apiMockCtrl.mockClient.baseUrl}/example`);
    });

    it('should construct the right url with auth', async () => {
      const gu = getUrl('example');
      const auth = new CcAuth();
      const spy = hanbi.spyMethod(auth, 'applyOnUrl').passThrough();
      spy.callsFake(/** @param {URL} url*/ (url) => url.searchParams.set('auth', 'token'));
      const client = createClient({}, auth);

      const url = client.getUrl(gu);

      expect(spy.callCount).to.equal(1);
      expect(url.toString()).to.equal(`${apiMockCtrl.mockClient.baseUrl}/example?auth=token`);
    });
  });

  describe('stream', () => {
    it('should call `_transformStreamParams` method with right params', async () => {
      client = createClient({
        defaultRequestConfig: {
          cors: false,
          timeout: 10,
        },
      });
      const spy = hanbi.stubMethod(client, '_transformStreamParams').passThrough();
      const command = streamCommand({ url: '/path/subPath' });

      await client.stream(command, {
        debug: true,
        cors: true,
      });

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.equal(command);
      expect(spy.firstCall.args[1].debug).to.equal(true);
      expect(spy.firstCall.args[1].cors).to.equal(true);
    });

    it('should call `createStream` method with right params', async () => {
      client = createClient({
        defaultRequestConfig: {
          cors: true,
          timeout: 10,
        },
        defaultStreamConfig: {
          healthcheckInterval: 10,
          retry: {
            backoffFactor: 10,
            maxRetryCount: 10,
          },
        },
      });
      const command = streamCommand({ url: '/path/subPath' });
      const spy = hanbi.stubMethod(command, 'createStream').passThrough();

      await client.stream(command, {
        debug: true,
        cors: false,
        retry: { maxRetryCount: 100 },
      });

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[1].retry.maxRetryCount).to.equal(100); // command config
      expect(spy.firstCall.args[1].retry.backoffFactor).to.equal(10); // client config
      expect(spy.firstCall.args[1].retry.initRetryTimeout).to.equal(1_000); // default config
      expect(spy.firstCall.args[1].debug).to.equal(true); // command config
      expect(spy.firstCall.args[1].healthcheckInterval).to.equal(10); // client config
      expect(spy.firstCall.args[1].heartbeatPeriod).to.equal(2_500); // default config
    });

    it('should call `command.toRequestParams` method with right params', async () => {
      hanbi.stubMethod(client, '_transformStreamParams').returns(Promise.resolve({ param: 'param' }));
      const command = streamCommand({ url: '/path/subPath' });
      const spy = hanbi.stubMethod(command, 'toRequestParams').passThrough();

      const stream = await client.stream(command);
      expect(spy.callCount).to.equal(0);

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({
          status: 200,
          events: [{ type: 'message', event: 'END_OF_STREAM', data: '{"endedBy": "UNTIL_REACHED"}' }],
        })
        .thenCall(() => startStream(stream));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.deep.equal({ param: 'param' });
    });

    it('should call `_prepareRequest` method with right params', async () => {
      const command = streamCommand({ url: '/path/subPath' });
      const spy = hanbi.stubMethod(client, '_prepareRequest').passThrough();

      const stream = await client.stream(command, {
        debug: true,
        cors: false,
      });

      await apiMockCtrl
        .mock()
        .when({ method: 'GET', path: '/path/subPath' })
        .respond({
          status: 200,
          events: [{ type: 'message', event: 'END_OF_STREAM', data: '{"endedBy": "UNTIL_REACHED"}' }],
        })
        .thenCall(() => startStream(stream));

      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.deep.equal({
        url: '/path/subPath',
      });
      expect(spy.firstCall.args[1]).to.deep.equal({
        debug: true,
        cors: false,
      });
    });
  });

  //------------------

  it('should send request with the right method and path', async () => {
    const command = simpleCommand(get('/path/subPath'));

    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/path/subPath' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command));
  });

  it('should send request with the right accept header', async () => {
    const command = simpleCommand(get('/'));

    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.headers.accept).to.eq('application/json');
      });
  });

  it('should send request with the right content-type header', async () => {
    const command = simpleCommand(post('/', 'hello world'));

    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.headers['content-type']).to.eq('text/plain');
      });
  });

  it('should send request with the right query params', async () => {
    const command = simpleCommand(get('/', new QueryParams({ foo: ['bar1', 'bar2'], bar: 'foo' })));

    await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.queryParams).to.deep.eq({ foo: ['bar1', 'bar2'], bar: 'foo' });
      });
  });

  it('should send request with the right plain text body', async () => {
    const command = simpleCommand(post('/', 'hello world'));

    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.body).to.eq('hello world');
      });
  });

  it('should send request with the right json body', async () => {
    const command = simpleCommand(post('/', { hello: 'world' }));

    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.body).to.deep.eq({ hello: 'world' });
      });
  });

  it('should send request with the right json body already stringified', async () => {
    const command = simpleCommand({
      method: 'POST',
      url: '/',
      headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
      body: '{"hello":"world"}',
    });

    await apiMockCtrl
      .mock()
      .when({ method: 'POST', path: '/' })
      .respond({ status: 200 })
      .thenCall(() => client.send(command))
      .verify((calls) => {
        expect(calls.count).to.equal(1);
        expect(calls.first.body).to.deep.eq('{"hello":"world"}');
      });
  });

  // response

  it('should get response with right text plain body', async () => {
    const command = simpleCommand({
      method: 'GET',
      url: '/',
      headers: new HeadersBuilder().acceptTextPlain().build(),
    });

    const response = await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({ status: 200, body: 'Hello' })
      .thenCall(() => client.send(command));
    expect(response).to.equal('Hello');
  });

  it('should get response with right json body', async () => {
    const command = simpleCommand(get('/'));

    const response = await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({ status: 200, body: { hello: 'world' } })
      .thenCall(() => client.send(command));
    expect(response).to.deep.eq({ hello: 'world' });
  });

  it('should get response with right empty body', async () => {
    const command = simpleCommand(get('/'));

    const response = await apiMockCtrl
      .mock()
      .when({ method: 'GET', path: '/' })
      .respond({ status: 200, body: null })
      .thenCall(() => client.send(command));
    expect(response).to.deep.eq(null);
  });
});
