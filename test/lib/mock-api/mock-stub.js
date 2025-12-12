/**
 * @import { Mock, MockCall, MockRequest, MockResponse } from './mock-api.types.js'
 * @import { MockClient } from './mock-client.js'
 */
import { createRequestKey } from './mock-utils.js';

/**
 * Fluent interface for creating mock API responses.
 * Provides a chainable API for configuring mock endpoints with various HTTP methods,
 * response codes, bodies, and delays.
 *
 * This class serves as the entry point for the fluent mock configuration API,
 * allowing you to chain method calls to build complex mock scenarios.
 *
 * @example
 * const stub = new MockStub(mockClient);
 *
 * // Configure a simple mock
 * await stub.when({ method: 'GET', path: '/api/users' })
 *    .respond({ status: 200, body: [{ id: 1, name: 'John' }] });
 *
 * // The fluent API is typically used through MockCtrl:
 * await mockCtrl.mock()
 *   .when({ method: 'GET', path: '/api/users' })
 *   .respond({ status: 200, body: [{ id: 1, name: 'John' }] });
 */
export class MockStub {
  /** @type {MockClient} The mock client used to configure server responses */
  #mockClient;
  /** @type {Array<Mock>} Array of mock configurations to apply */
  #mocks = [];

  /**
   * Creates a new MockStub instance.
   *
   * @param {MockClient} mockClient - The mock client to use for configuring responses
   */
  constructor(mockClient) {
    this.#mockClient = mockClient;
  }

  /**
   * Adds another mock configuration to the multi-mock chain.
   * This allows you to configure multiple endpoints in a single fluent chain.
   *
   * @param {MockRequest} request - Request pattern for the additional mock
   * @returns {{respond: (response: MockResponse, throttle?: number) => MockStub}}
   *   Object with `respond` method for configuring the mock response
   *
   * @example
   * await mockStub
   *   .when({ method: 'GET', path: '/api/users' })
   *   .respond({ status: 200, body: [] })
   *   .when({ method: 'POST', path: '/api/users' })
   *   .respond({ status: 201, body: { id: 1 } });
   */
  when(request) {
    return {
      /**
       * Specifies the response for the additional mock configuration.
       *
       * @param {MockResponse} response - HTTP response
       * @param {number} [throttle] - Optional delay in milliseconds
       * @returns {MockStub} This instance for further chaining
       */
      respond: (response, throttle) => {
        this.#mocks.push({
          request,
          response: response,
          throttle,
        });
        return this;
      },
    };
  }

  /**
   * Executes a callback function after applying all mock configurations.
   * This allows you to run test code immediately after all mocks are set up.
   *
   * @template T - The return type of the callback function
   * @param {() => Promise<T>} callback - Async function to execute after applying all mocks
   * @returns {MockStubVerifier<T>} Verifier that can validate API calls for specific endpoints
   *
   * @example
   * const result = await mockStub
   *   .when({ method: 'GET', path: '/api/users' })
   *   .respond({ status: 200, body: [] })
   *   .when({ method: 'POST', path: '/api/users' })
   *   .respond({ status: 201, body: { id: 1 } })
   *   .thenCall(async () => {
   *     const users = await fetch('/api/users').then(r => r.json());
   *     const newUser = await fetch('/api/users', { method: 'POST' }).then(r => r.json());
   *     return { users, newUser };
   *   })
   *   .verify(calls => {
   *     expect(calls.count()).toBe(1);
   *   }, 'GET', '/api/users');
   */
  thenCall(callback) {
    return new MockStubVerifier(this.#mockClient, callback, this.#mocks);
  }

  /**
   * Applies all mock configurations to the server.
   * This method makes the class thenable, allowing it to be used with await.
   *
   * @param {((res: void) => any)} resolve - Promise resolve callback
   * @param {(e: any) => void} reject - Promise reject callback
   *
   * @example
   * await mockStub
   *   .when({ method: 'GET', path: '/api/users' })
   *   .respond({ status: 200, body: [] })
   *   .when({ method: 'POST', path: '/api/users' })
   *   .respond({ status: 201, body: { id: 1 } });
   */
  then(resolve, reject) {
    Promise.all(this.#mocks.map((mock) => this.#mockClient.mock(mock)))
      .then(() => resolve())
      .catch((err) => reject(err));
  }
}

/**
 * Verifier that can validate API calls.
 *
 * This class extends MockStubVerifier to provide verification capabilities
 * for multiple mock endpoints. It collects calls made to each mocked endpoint
 * and allows verification of call counts, parameters, and other call details
 * for specific method/path combinations.
 *
 * @template T - The return type of the callback function
 *
 * @example
 * await mockStub
 *   .when({ method: 'GET', path: '/api/users' })
 *   .respond({ status: 200, body: [] })
 *   .when({ method: 'POST', path: '/api/users' })
 *   .respond({ status: 201, body: { id: 1 } })
 *   .when({ method: 'GET', path: '/api/posts' })
 *   .respond({ status: 200, body: [] })
 *   .thenCall(async () => {
 *     await fetch('/api/users');
 *     await fetch('/api/users', { method: 'POST' });
 *     await fetch('/api/posts');
 *   })
 *   .verify(calls => {
 *     expect(calls.filter({ method: 'GET', path: '/api/users' }).count).toBe(1);
 *     expect(calls.filter({ method: 'POST', path: '/api/users' }).count).toBe(1);
 *     expect(calls.filter({ method: 'GET', path: '/api/posts' }).count).toBe(1);
 *   });
 */
class MockStubVerifier {
  /** @type {MockClient} The mock client used to configure server responses */
  #mockClient;
  /** @type {() => Promise<T>} The callback function to execute after applying mocks */
  #callback;
  /** @type {Array<Mock>} Array of mock configurations to apply */
  #mocks;
  /** @type {Array<() => void>} Array of verification functions to execute */
  #expectations = [];
  /** @type {T} The result of executing the callback function */
  #result;
  /** @type {Array<MockCall>} Arrays of calls */
  #calls;

  /**
   * Creates a new MockStubVerifier instance.
   *
   * @param {MockClient} mockClient - The mock client to use for configuring responses
   * @param {() => Promise<T>} callback - The callback function to execute after applying mocks
   * @param {Array<Mock>} mocks - Array of mock configurations to apply
   */
  constructor(mockClient, callback, mocks) {
    this.#mockClient = mockClient;
    this.#callback = callback;
    this.#mocks = mocks;
  }

  /**
   * Adds a verification function to validate calls made.
   *
   * The verification callback receives a Calls object that provides methods
   * to inspect the calls made to the specified mock request,
   * including count, parameters, and individual call details.
   *
   * @param {(calls: Calls) => void} verifyCallback - Function to verify the calls
   * @returns {this} This instance for method chaining
   *
   * @example
   * await mockStub
   *   .when({ method: 'GET', path: '/api/users' })
   *   .respond({ status: 200, body: [] })
   *   .when({ method: 'POST', path: '/api/users' })
   *   .respond({ status: 201, body: { id: 1 } })
   *   .thenCall(async () => {
   *     await fetch('/api/users');
   *     await fetch('/api/users', { method: 'POST', body: JSON.stringify({ name: 'John' }) });
   *   })
   *   .verify(calls => {
   *     expect(calls.count).toBe(2);
   *     expect(calls.filter({ method: 'GET', path: '/api/users' })).toBe(1);
   *     expect(calls.filter({ method: 'POST', path: '/api/users' })).toBe(1);
   *   });
   */
  verify(verifyCallback) {
    this.#expectations.push(() => {
      verifyCallback(new Calls(this.#calls));
    });
    return this;
  }

  /**
   * Executes the complete mock verification process.
   *
   * This protected method:
   * 1. Applies all mock configurations to the server
   * 2. Executes the callback function
   * 3. Runs internal verification logic (implemented by subclasses)
   * 4. Executes all verification expectations
   *
   * @protected
   * @returns {Promise<T>} The result of the callback function
   */
  async _toss() {
    await Promise.all(this.#mocks.map((mock) => this.#mockClient.mock(mock)));
    this.#result = await this.#callback();
    this.#calls = await this.#mockClient.getCalls();
    for (let expectation of this.#expectations) {
      expectation();
    }
    return this.#result;
  }

  /**
   * Makes the verifier thenable, allowing it to be used with await.
   * Executes the complete verification process and returns the callback result.
   *
   * @param {((res: T) => any)} resolve - Promise resolve callback
   * @param {(e: any) => void} reject - Promise reject callback
   *
   * @example
   * const result = await mockStub
   *   .when({ method: 'GET', path: '/api/users' })
   *   .respond({ status: 200, body: [] })
   *   .thenCall(async () => {
   *     return await fetch('/api/users').then(r => r.json());
   *   })
   *   .verify(calls => expect(calls.count).toBe(1));
   */
  then(resolve, reject) {
    this._toss()
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  }
}

/**
 * Wrapper class for inspecting API calls made to mocked endpoints.
 *
 * This class provides convenient methods to examine the calls that were made
 * to a mocked endpoint during test execution, including accessing individual
 * calls, counting calls, and retrieving first/last calls.
 *
 * @example
 * .verify(calls => {
 *   expect(calls.count).toBe(2);
 *   expect(calls.first.method).toBe('GET');
 *   expect(calls.last.query).toEqual({ page: '2' });
 *   expect(calls.at(0).body).toBeUndefined();
 * })
 */
class Calls {
  /** @type {Array<MockCall>} - Arrays of calls */
  calls;

  /**
   * Creates a new Calls instance.
   *
   * @param {Array<MockCall>} calls - Arrays of calls
   */
  constructor(calls) {
    this.calls = calls;
  }

  /**
   * @param {MockRequest} request - Request pattern
   * @returns {Calls} Calls matching the specified request
   */
  filter(request) {
    const expectedKey = createRequestKey(request);
    const filteredCalls = this.calls.filter((call) => {
      return createRequestKey(call.matchingMockRequest) === expectedKey;
    });
    return new Calls(filteredCalls);
  }

  /**
   * Gets the total number of calls
   *
   * @returns {number} The number of calls made
   *
   * @example
   * .verify(calls => {
   *   expect(calls.count).toBe(3); // Expect exactly 3 calls
   *   expect(calls.count).toBeGreaterThan(0); // Expect at least one call
   * })
   */
  get count() {
    return this.calls.length;
  }

  /**
   * Gets the call at the specified index.
   *
   * @param {number} index - Zero-based index of the call to retrieve
   * @returns {MockCall} The call at the specified index
   *
   * @example
   * .verify(calls => {
   *   const firstCall = calls.at(0);
   *   const secondCall = calls.at(1);
   *   expect(firstCall.method).toBe('GET');
   *   expect(secondCall.query).toEqual({ page: '2' });
   * })
   */
  at(index) {
    return this.calls[index];
  }

  /**
   * Gets the first call made to the endpoint.
   *
   * @returns {MockCall} The first call, or undefined if no calls were made
   *
   * @example
   * .verify(calls => {
   *   expect(calls.first.method).toBe('GET');
   *   expect(calls.first.path).toBe('/api/users');
   * })
   */
  get first() {
    return this.calls[0];
  }

  /**
   * Gets the last call made to the endpoint.
   *
   * @returns {MockCall} The last call, or undefined if no calls were made
   *
   * @example
   * .verify(calls => {
   *   expect(calls.last.method).toBe('POST');
   *   expect(calls.last.body).toEqual({ name: 'John' });
   * })
   */
  get last() {
    return this.calls[this.calls.length - 1];
  }
}
