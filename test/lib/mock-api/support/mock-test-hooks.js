import { MockClient } from '../mock-client.js';
import { MockCtrl } from '../mock-ctrl.js';

/** @type {boolean} Environment detection: true if running in Node.js, false if in browser */
const IS_NODE = globalThis.process != null;

/**
 * Creates test hooks for setting up and tearing down mock API infrastructure.
 *
 * This function provides a standardised way to integrate mock API testing into
 * test suites, handling both Node.js and browser environments automatically.
 *
 * In Node.js environments, it starts a real mock server using the mockStart function.
 * In browser environments, it assumes the mock server is already running and
 * connects to it via the current page's origin.
 *
 * @returns {{before: () => Promise<MockCtrl>, beforeEach: () => Promise<void>, after: () => Promise<void>}}
 *   Object containing test lifecycle hooks
 */
export function mockTestHooks() {
  /** @type {MockCtrl} Global mock controller instance shared across test hooks */
  let mockCtrl;

  /** @type {null|(() => Promise<void>)} Function to stop the mock server */
  let stopServer = null;

  return {
    /**
     * Sets up the mock API environment before tests run.
     *
     * In Node.js: Starts a new mock server on free ports
     * In Browser: Connects to existing mock server at current origin
     *
     * @returns {Promise<MockCtrl>} The mock controller for configuring mocks
     */
    before: async () => {
      if (IS_NODE) {
        const { mockStart } = await import('../mock-start.js');
        const mockServer = await mockStart();
        stopServer = mockServer.stop;
        mockCtrl = mockServer.ctrl;
      } else {
        const url = new URL(window.location.href);
        mockCtrl = new MockCtrl(new MockClient(`${url.origin}/admin`, `${url.origin}/mock`));
      }

      return mockCtrl;
    },

    /**
     * Resets all mocks and call logs before each test.
     * This ensures each test starts with a clean mock state.
     *
     * @returns {Promise<void>}
     */
    beforeEach: async () => {
      return mockCtrl?.mockClient.reset();
    },

    /**
     * Cleans up the mock environment after all tests complete.
     * In Node.js environments, this stops the mock server.
     *
     * @returns {Promise<void>}
     */
    after: async () => {
      await stopServer?.();
    },
  };
}
