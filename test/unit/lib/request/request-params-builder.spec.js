/**
 * @import { CcRequestParams } from '../../../../src/types/request.types.js'
 */
import { expect } from 'chai';
import { HeadersBuilder } from '../../../../src/lib/request/headers-builder.js';
import { QueryParams } from '../../../../src/lib/request/query-params.js';
import {
  delete_,
  get,
  head,
  patch,
  patchJson,
  post,
  postJson,
} from '../../../../src/lib/request/request-params-builder.js';

describe('RequestParamsBuilder', () => {
  describe('get', () => {
    it('should create GET request with default values', () => {
      const result = get('/test');
      expectRequestParams(result, {
        method: 'GET',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().build(),
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams({ page: 1 });
      const result = get('/test', queryParams);
      expectRequestParams(result, {
        method: 'GET',
        url: '/test',
        queryParams,
        headers: new HeadersBuilder().acceptJson().build(),
      });
    });
  });

  describe('post', () => {
    it('should create POST request with null body and empty content type', () => {
      const result = post('/test');
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().build(),
        body: undefined,
      });
    });

    it('should create POST request with string body and text plain content type', () => {
      const result = post('/test', 'string');
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeTextPlain().build(),
        body: 'string',
      });
    });

    it('should create POST request with object body and JSON content type', () => {
      const result = post('/test', { body: 'string' });
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: { body: 'string' },
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = post('/test', undefined, queryParams);
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: queryParams,
        headers: new HeadersBuilder().acceptJson().build(),
        body: undefined,
      });
    });
  });

  describe('postJson', () => {
    it('should create POST request with null body and JSON content type', () => {
      const result = postJson('/test');
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: undefined,
      });
    });

    it('should create POST request with string body and JSON content type', () => {
      const result = postJson('/test', 'string');
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: 'string',
      });
    });

    it('should create POST request with object body and JSON content type', () => {
      const result = postJson('/test', { body: 'string' });
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: { body: 'string' },
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = postJson('/test', undefined, queryParams);
      expectRequestParams(result, {
        method: 'POST',
        url: '/test',
        queryParams: queryParams,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: undefined,
      });
    });
  });

  describe('patch', () => {
    it('should create PATCH request with null body and empty content type', () => {
      const result = patch('/test');
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().build(),
        body: undefined,
      });
    });

    it('should create PATCH request with string body and text plain content type', () => {
      const result = patch('/test', 'string');
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeTextPlain().build(),
        body: 'string',
      });
    });

    it('should create PATCH request with object body and JSON content type', () => {
      const result = patch('/test', { body: 'string' });
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: { body: 'string' },
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = patch('/test', undefined, queryParams);
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: queryParams,
        headers: new HeadersBuilder().acceptJson().build(),
        body: undefined,
      });
    });
  });

  describe('patchJson', () => {
    it('should create PATCH request with null body and JSON content type', () => {
      const result = patchJson('/test');
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: undefined,
      });
    });

    it('should create PATCH request with string body and JSON content type', () => {
      const result = patchJson('/test', 'string');
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: 'string',
      });
    });

    it('should create PATCH request with object body and JSON content type', () => {
      const result = patchJson('/test', { body: 'string' });
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: { body: 'string' },
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = patchJson('/test', undefined, queryParams);
      expectRequestParams(result, {
        method: 'PATCH',
        url: '/test',
        queryParams: queryParams,
        headers: new HeadersBuilder().acceptJson().contentTypeJson().build(),
        body: undefined,
      });
    });
  });

  describe('head', () => {
    it('should create HEAD request with default values', () => {
      const result = head('/test');
      expectRequestParams(result, {
        method: 'HEAD',
        url: '/test',
        queryParams: undefined,
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = head('/test', queryParams);
      expectRequestParams(result, {
        method: 'HEAD',
        url: '/test',
        queryParams: queryParams,
      });
    });
  });

  describe('delete', () => {
    it('should create DELETE request with default values', () => {
      const result = delete_('/test');
      expectRequestParams(result, {
        method: 'DELETE',
        url: '/test',
        queryParams: undefined,
        headers: new HeadersBuilder().acceptJson().build(),
      });
    });

    it('should include query params when provided', () => {
      const queryParams = new QueryParams().set('page', 1);
      const result = delete_('/test', queryParams);
      expectRequestParams(result, {
        method: 'DELETE',
        url: '/test',
        queryParams: queryParams,
        headers: new HeadersBuilder().acceptJson().build(),
      });
    });
  });
});

/**
 *
 * @param {Partial<CcRequestParams>} actual
 * @param {Partial<CcRequestParams>} expected
 */
function expectRequestParams(actual, expected) {
  expect(actual.method).to.equal(expected.method);
  expect(actual.url).to.equal(expected.url);
  expect(actual.queryParams?.toObject()).to.deep.equal(expected.queryParams?.toObject());
  expect(getHeadersEntries(actual.headers)).to.deep.equal(getHeadersEntries(expected.headers));
  expect(actual.body).to.deep.equal(expected.body);
}

/** @param {Headers} headers */
function getHeadersEntries(headers) {
  return Array.from(headers?.entries() ?? []);
}
