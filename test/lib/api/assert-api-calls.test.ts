import type { Calls, MockCall } from '@clevercloud/doublure';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertApiCalls } from './assert-api-calls.ts';

describe('assertApiCalls', () => {
  function call(overrides: Partial<MockCall>): MockCall {
    return { method: 'GET', path: '/v2/self', queryParams: {}, headers: {}, body: undefined, ...overrides };
  }

  /** Only `toArray()` is used by `assertApiCalls()`. */
  function calls(...list: Array<MockCall>): Pick<Calls, 'toArray'> {
    return { toArray: () => list };
  }

  it('should compare method and path, in order', () => {
    assertApiCalls(calls(call({}), call({ path: '/v2/self/emails' })), [
      { method: 'GET', path: '/v2/self' },
      { method: 'GET', path: '/v2/self/emails' },
    ]);
  });

  it('with a missing or an extra call, should fail', () => {
    assert.throws(() => assertApiCalls(calls(call({})), []), assert.AssertionError);
    assert.throws(() => assertApiCalls(calls(), [{ method: 'GET', path: '/v2/self' }]), assert.AssertionError);
  });

  it('with an unexpected query or body, should fail', () => {
    assert.throws(
      () => assertApiCalls(calls(call({ queryParams: { a: '1' } })), [{ method: 'GET', path: '/v2/self' }]),
      assert.AssertionError,
    );
    assert.throws(
      () => assertApiCalls(calls(call({ method: 'POST', body: { a: 1 } })), [{ method: 'POST', path: '/v2/self' }]),
      assert.AssertionError,
    );
  });

  it('with an expected query and body, should compare them', () => {
    assertApiCalls(calls(call({ method: 'POST', queryParams: { a: '1' }, body: { b: 2 } })), [
      { method: 'POST', path: '/v2/self', query: { a: '1' }, body: { b: 2 } },
    ]);
  });

  it('should only compare the expected headers, case insensitive', () => {
    const received = calls(call({ headers: { 'content-type': 'application/json', 'user-agent': 'clever' } }));

    assertApiCalls(received, [{ method: 'GET', path: '/v2/self' }]);
    assertApiCalls(received, [{ method: 'GET', path: '/v2/self', headers: { 'Content-Type': 'application/json' } }]);
    assert.throws(
      () => assertApiCalls(received, [{ method: 'GET', path: '/v2/self', headers: { accept: 'application/json' } }]),
      assert.AssertionError,
    );
  });
});
