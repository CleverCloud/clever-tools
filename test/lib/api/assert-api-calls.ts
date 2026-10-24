import type { Calls, MockCall } from '@clevercloud/doublure';
import assert from 'node:assert/strict';

/**
 * Expected API call. An omitted `query` or `body` must be absent from the call.
 * Omitted `headers` are not checked, otherwise only the listed ones are compared (names are case insensitive).
 * A query param or a header received several times is an array, once a string.
 */
export interface ApiCallExpectation {
  method: string;
  path: string;
  query?: Record<string, string | Array<string>>;
  headers?: Record<string, string | Array<string>>;
  body?: unknown;
}

/**
 * Assert the calls received by the API mock, in order, in a single deep equal (the number of calls included).
 * @param calls - Calls as recorded by doublure, i.e. `await apiMock.getCalls()`
 * @param expected - One expectation per call, see `ApiCallExpectation`
 */
export function assertApiCalls(calls: Pick<Calls, 'toArray'>, expected: Array<ApiCallExpectation>): void {
  const normalizedExpected = expected.map(normalizeApiCallExpectation);
  const actual = calls.toArray().map((call, index) => toComparableApiCall(call, normalizedExpected[index]?.headers));
  assert.deepEqual(actual, normalizedExpected);
}

function normalizeApiCallExpectation(expected: ApiCallExpectation): ApiCallExpectation {
  const { method, path, query, headers, body } = expected;
  const normalized: ApiCallExpectation = { method, path };
  if (query != null && Object.keys(query).length > 0) {
    normalized.query = query;
  }
  if (headers != null) {
    normalized.headers = Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
    );
  }
  // `null` is a valid JSON body, only a missing one is left out
  if (body !== undefined) {
    normalized.body = body;
  }
  return normalized;
}

/** Keep the fields of a call an expectation can check, and only the headers it lists. */
function toComparableApiCall(call: MockCall, expectedHeaders: ApiCallExpectation['headers']): ApiCallExpectation {
  const comparable: ApiCallExpectation = { method: call.method, path: call.path };
  if (Object.keys(call.queryParams).length > 0) {
    comparable.query = call.queryParams;
  }
  if (expectedHeaders != null) {
    // Node lowercases the names of the headers it receives.
    comparable.headers = {};
    for (const name of Object.keys(expectedHeaders)) {
      if (call.headers[name] != null) {
        comparable.headers[name] = call.headers[name];
      }
    }
  }
  // `null` is a valid JSON body, only a missing one is left out
  if (call.body !== undefined) {
    comparable.body = call.body;
  }
  return comparable;
}
