/**
 * @import { Mock, MockCall } from './mock-api.types.js';
 */

/**
 * Client for interacting with a mock API server during testing.
 * Provides methods to configure mock responses, reset the server state, and retrieve call logs.
 *
 * The MockClient manages two URLs:
 * - Admin URL: Used for configuring mocks and retrieving call logs
 * - Mock URL: The actual API endpoint that applications under test should call
 */
export class MockClient {
  /** @type {string} Base URL for the mock server's admin interface */
  #baseUrlAdmin;

  /** @type {string} Base URL for the mock API endpoints */
  #baseUrlMock;

  /**
   * Creates a new MockClient instance.
   *
   * @param {string} baseUrlAdmin - Base URL for the mock server's admin interface (used for configuration)
   * @param {string} baseUrlMock - Base URL for the mock API endpoints (used by the application under test)
   */
  constructor(baseUrlAdmin, baseUrlMock) {
    this.#baseUrlAdmin = baseUrlAdmin;
    this.#baseUrlMock = baseUrlMock;
  }

  /**
   * Gets the base URL for the mock API endpoints.
   * This is the URL that applications under test should use to make API calls.
   *
   * @returns {string} The mock API base URL
   */
  get baseUrl() {
    return this.#baseUrlMock;
  }

  /**
   * Resets the mock server, clearing all configured mocks and call logs.
   * This is typically called before each test to ensure a clean state.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the reset operation fails
   */
  async reset() {
    const response = await fetch(`${this.#baseUrlAdmin}/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      console.log(response.status);
      throw new Error(`Failed to reset: ${response.status}`);
    }
  }

  /**
   * Configures a mock response for a specific request pattern.
   * When the mock server receives a request matching the pattern, it will respond with the configured response.
   *
   * @param {Mock} mock - The mock configuration defining request pattern and response
   * @returns {Promise<void>}
   * @throws {Error} If the mock configuration fails
   */
  async mock(mock) {
    const response = await fetch(`${this.#baseUrlAdmin}/mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mock),
    });

    if (!response.ok) {
      throw new Error(`Failed to mock: ${response.status}`);
    }
  }

  /**
   * Retrieves all recorded calls.
   * This is useful for verifying that the application under test made the expected API calls.
   *
   * @returns {Promise<Array<MockCall>>} Array of calls
   * @throws {Error} If retrieving calls fails
   */
  async getCalls() {
    const response = await fetch(`${this.#baseUrlAdmin}/calls`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get calls: ${response.status}`);
    }

    return await response.json();
  }
}
