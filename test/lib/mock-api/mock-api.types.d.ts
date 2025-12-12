/**
 * Configuration for a mock API endpoint.
 * Defines how the mock server should respond to specific requests.
 *
 * @example
 * const mock = {
 *   request: { method: 'GET', path: '/api/users' },
 *   response: { status: 200, body: [{ id: 1, name: 'John' }] },
 *   throttle: 100 // Optional delay in milliseconds
 * };
 */
export interface Mock {
  /** The request pattern to match */
  request: MockRequest;
  /** The response to return when the request matches */
  response: MockResponse;
  /** Optional delay in milliseconds before responding */
  throttle?: number;
}

export type MockResponse = MockHttpResponse | MockSseResponse;

/**
 * Defines the request pattern that a mock should match.
 * Used to identify which requests should be handled by a specific mock.
 *
 * @example
 * const request = {
 *   method: 'POST',
 *   path: '/api/applications'
 * };
 */
export interface MockRequest {
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  /** URL path to match (can include path parameters) */
  path: string;
}

/**
 * Defines the response that a mock should return.
 * Includes status code and optional response body.
 *
 * @example
 * const response = {
 *   status: 201,
 *   body: { id: 'app_123', name: 'My App' }
 * };
 */
export interface MockHttpResponse {
  /** HTTP status code to return */
  status: number;
  /** Optional response body (can be any JSON-serializable value) */
  body?: any;
}

/**
 * Mock response configuration for Server-Sent Events (SSE) streams.
 * Defines the events to stream and timing between events.
 *
 * @example
 * {
 *   status: 200,
 *   events: [
 *     { type: 'message', event: 'DATA', data: 'hello' },
 *     { type: 'message', event: 'END_OF_STREAM' },
 *     { type: 'close' }
 *   ],
 *   delayBetween: 50
 * }
 */
export interface MockSseResponse {
  /** HTTP status code to return */
  status: number;
  /** Array of SSE events to stream */
  events: Array<MockSseEvent>;
  /** Delay in milliseconds between each event */
  delayBetween: number;
}

/**
 * Represents a recorded API call made during testing.
 * Contains all details about the request that was made and the response that was returned.
 *
 * @template T - Type of the request body
 *
 * @example
 * const call = {
 *   method: 'POST',
 *   path: '/api/applications',
 *   queryParams: { ownerId: 'user_123' },
 *   headers: { 'Content-Type': 'application/json' },
 *   body: { name: 'My App' },
 *   response: { status: 201, body: { id: 'app_123' } }
 * };
 */
export interface MockCall<T = any> {
  /** HTTP method used in the request */
  method: string;
  /** URL path that was requested */
  path: string;
  /** Query parameters included in the request */
  queryParams: Record<string, OneOrMany<string>>;
  /** HTTP headers sent with the request */
  headers: Record<string, OneOrMany<string>>;
  /** Request body data */
  body: T;
  /** Response that was returned (if any) */
  response?: MockResponse;
  /** The matching mock request (if any) */
  matchingMockRequest?: MockRequest;
}

/**
 * Utility type representing a value that can be either a single item or an array of items.
 * Commonly used for HTTP headers and query parameters which can have multiple values.
 *
 * @template T - The type of the value(s)
 */
export type OneOrMany<T> = T | Array<T>;

/**
 * Configuration for a Server-Sent Events message.
 * Defines the event type, data payload, and optional metadata.
 */
export interface MockSseMessage {
  /** The event type name */
  event: string;
  /** Unique identifier for the message (auto-generated if not provided) */
  id?: string;
  /** The data payload of the message (will be JSON.stringify'd if object) */
  data?: string | number | boolean | object;
  /** Retry timeout in milliseconds for reconnection */
  retry?: number;
}

/**
 * Union type for all possible SSE events that can be streamed.
 * Supports both message events with data and close events to terminate the stream.
 */
export type MockSseEvent = MockSseEventMessage | MockSseEventClose;

/**
 * SSE message event that sends data to the client.
 * Extends MockSseMessage with a fixed type of 'message'.
 */
export interface MockSseEventMessage extends MockSseMessage {
  type: 'message';
}

/**
 * SSE close event that terminates the connection.
 * Simulates the server closing the connection.
 */
export interface MockSseEventClose {
  type: 'close';
}
