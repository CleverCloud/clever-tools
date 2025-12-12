import { MockClient } from './mock-client.js';
import { MockCtrl } from './mock-ctrl.js';
import { startServer } from './mock-server.js';

/**
 * Starts a complete mock API testing environment.
 *
 * This convenience function combines starting the mock server with creating
 * a configured MockCtrl instance, providing everything needed for API mocking in tests.
 *
 * The function:
 * 1. Starts both admin and mock servers on free ports
 * 2. Creates a MockClient configured with the server URLs
 * 3. Wraps the client in a MockCtrl for fluent API usage
 * 4. Returns both the controller and a stop function
 *
 * @returns {Promise<{stop: () => Promise<void>, ctrl: MockCtrl}>}
 *   Object containing the mock controller and server stop function
 */
export async function mockStart() {
  const { adminPort, mockPort, stop } = await startServer();
  return {
    stop,
    ctrl: new MockCtrl(new MockClient(`http://localhost:${adminPort}`, `http://localhost:${mockPort}`)),
  };
}
