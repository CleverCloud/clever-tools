import proxy from 'koa-proxies';
import { startServer } from '../mock-server.js';

/** @type {null|(() => Promise<void>)} Function to stop the mock server */
let stopServer = null;

/**
 * Web Test Runner plugin for integrating mock API functionality into browser tests.
 *
 * This plugin automatically starts a mock server and sets up proxy routes to make
 * the mock API accessible from browser tests. It handles both the mock API endpoints
 * and the admin interface for configuring mocks.
 *
 * The plugin creates two proxy routes:
 * - `/admin/*` → Admin server (for configuring mocks and retrieving call logs)
 * - `/mock/*` → Mock API server (for actual API calls)
 */
export const mockApiPlugin = {
  /** Plugin name for Web Test Runner */
  name: 'mock-apis',

  /**
   * Called when the Web Test Runner server starts.
   * Sets up the mock server and configures proxy routes.
   *
   * @param {object} params - Plugin parameters
   * @param {any} params.app - Koa application instance
   * @returns {Promise<void>}
   */
  serverStart: async ({ app }) => {
    const mockServer = await startServer();
    stopServer = mockServer.stop;

    // Proxy /admin/* requests to the admin server
    app.use(
      proxy('/admin', {
        rewrite: (path) => path.replace(/^\/admin\//g, '/'),
        target: `http://localhost:${mockServer.adminPort}`,
      }),
    );

    // Proxy /mock/* requests to the mock server
    app.use(
      proxy('/mock', {
        rewrite: (path) => path.replace(/^\/mock\//g, '/'),
        target: `http://localhost:${mockServer.mockPort}`,
        events: {
          // When mocking SSE, we can simulate the request socket close.
          // We make sure to close the request socket when we detect the proxy socket close
          proxyReq: (proxyReq, req) => {
            proxyReq.on('close', () => {
              req.socket.destroy();
            });
          },
        },
      }),
    );
  },

  /**
   * Stops the mock server when the Web Test Runner shuts down.
   *
   * @returns {Promise<void>}
   */
  stopServer: async () => {
    await stopServer?.();
  },
};
