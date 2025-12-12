# Mock API Testing Infrastructure

A comprehensive testing framework for mocking HTTP APIs in both Node.js and browser environments. This infrastructure provides a complete solution for creating, managing, and verifying mock API responses during testing.

## Overview

The Mock API system consists of several key components:

- **Mock Server** - HTTP server that responds to API calls with configured responses
- **Admin Interface** - Management API for configuring mocks and retrieving call logs
- **Fluent API** - Chainable interface for easy mock configuration
- **Verification System** - Tools for validating API calls and responses
- **Test Integration** - Hooks and plugins for seamless test framework integration

## Quick Start

```javascript
import { mockStart } from './mock-start.js';

// Start mock server
const { ctrl, stop } = await mockStart();

try {
  // Configure a mock
  await ctrl.mock()
    .when({ method: 'GET', path: '/api/users' })
    .respond({ status: 200, body: [{ id: 1, name: 'John' }] });

  // Make API calls
  const response = await fetch(`${ctrl.mockClient.baseUrl}/api/users`);
  const users = await response.json();

  // Verify calls
  const calls = await ctrl.mockClient.getCalls({ method: 'GET', path: '/api/users' });
  expect(calls).toHaveLength(1);
} finally {
  await stop();
}
```

## Core Components

### MockClient (`mock-client.js`)

The foundational client for interacting with the mock server infrastructure.

**Key Features:**
- Configures mock responses via admin interface
- Retrieves call logs for verification
- Resets mock state between tests
- Works in both Node.js and browser environments

**Example:**
```javascript
const mockClient = new MockClient('http://localhost:3001', 'http://localhost:3000');

// Configure a regular HTTP mock
await mockClient.mock({
  request: { method: 'GET', path: '/api/users' },
  response: { status: 200, body: [] }
});

// Configure a Server-Sent Events mock
await mockClient.mock({
  request: { method: 'GET', path: '/api/events' },
  response: {
    status: 200,
    events: [
      { type: 'message', event: 'DATA', data: 'hello world' },
      { type: 'message', event: 'END_OF_STREAM' }
    ],
    delayBetween: 50
  }
});

// Get call logs
const calls = await mockClient.getCalls();
```

### MockCtrl (`mock-ctrl.js`)

Fluent interface wrapper around MockClient for easier mock configuration.

**Key Features:**
- Chainable API for mock configuration
- Simplified syntax for common operations
- Direct access to underlying MockClient

**Example:**
```javascript
const mockCtrl = new MockCtrl(mockClient);

await mockCtrl.mock()
  .when({ method: 'GET', path: '/api/users' })
  .respond({ status: 200, body: [] })
  .when({ method: 'POST', path: '/api/users' })
  .respond({ status: 201, body: { id: 1 } })
  .when({ method: 'GET', path: '/api/events' })
  .respond({
    status: 200,
    events: [
      { type: 'message', event: 'DATA', data: 'hello world' },
      { type: 'close' } // ask the server to close the SSE
    ],
    delayBetween: 50
  });
```

### MockStub (`mock-stub.js`)

Advanced fluent API with verification capabilities and callback execution.

**Key Features:**
- Execute callbacks after mock setup
- Verify API calls with detailed inspection
- Support for single and multiple mock configurations
- Chainable verification methods

```javascript
// HTTP response verification
const result = await mockStub
  .when({ method: 'GET', path: '/api/users' })
  .respond({ status: 200, body: [] })
  .thenCall(async () => {
    return await fetch('/api/users').then(r => r.json());
  })
  .verify(calls => {
    expect(calls.count).toBe(1);
    expect(calls.first.method).toBe('GET');
  });

// Server-Sent Events verification
await mockStub
  .when({ method: 'GET', path: '/api/stream' })
  .respond({
    status: 200,
    events: [
      { type: 'message', event: 'DATA', data: 'event1' },
      { type: 'message', event: 'DATA', data: 'event2' },
      { type: 'close' }
    ],
    delayBetween: 10
  })
  .thenCall(async () => {
    // Your SSE client code here - could use EventSource in browser
    // or a streaming HTTP client in Node.js to read the events
    await fetch('/api/stream', {
      headers: { Accept: 'text/event-stream' }
    });
  })
  .verify(calls => {
    expect(calls.count).toBe(1);
    expect(calls.first.headers.accept).toBe('text/event-stream');
  });
```

### Mock Server (`mock-server.js`)

HTTP server implementation that handles both mock responses and admin operations.

**Key Features:**
- Serves mock responses based on configured rules
- Provides admin API for mock management
- Logs all incoming requests for verification
- Supports response delays and throttling
- Server-Sent Events (SSE) streaming with configurable events and delays

**Server Endpoints:**
- `POST /mock` - Configure a new mock response
- `POST /calls` - Retrieve call logs for specific requests
- `POST /reset` - Clear all mocks and call logs
- `*` - Serve configured mock responses

**SSE Event Types:**
- `{ type: 'message', event: 'EVENT_NAME', data?: any, id?: string, retry?: number }` - Send SSE message
- `{ type: 'close' }` - Close the connection

## Test Integration

### Test Hooks (`support/mock-test-hooks.js`)

Lifecycle hooks for integrating with test frameworks like Mocha, Jest, etc.

**Example with Mocha:**
```javascript
import { mockTestHooks } from './support/mock-test-hooks.js';

describe('API Tests', () => {
  const hooks = mockTestHooks();
  let mockCtrl;

  before(async () => {
    mockCtrl = await hooks.before();
  });

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  after(() => {
    hooks.after();
  });

  it('should handle user requests', async () => {
    const result = await mockCtrl.mock()
      .when({ method: 'GET', path: '/api/users' })
      .respond({ status: 200, body: [] })
      .thenCall(() => fetch('/api/users').then(r => r.json()))
      .verify(calls => {
         expect(calls.count).toBe(1);
         expect(calls.first.method).toBe('GET');
      });

    // Your test code here
  });

  it('should handle SSE streams', async () => {
    await mockCtrl.mock()
      .when({ method: 'GET', path: '/api/events' })
      .respond({
        status: 200,
        events: [
          { type: 'message', event: 'DATA', data: 'event1' },
          { type: 'message', event: 'END_OF_STREAM' }
        ],
        delayBetween: 10
      });

    // Your SSE client code here - use EventSource in browser or streaming client in Node.js
    const response = await fetch(`${mockCtrl.mockClient.baseUrl}/api/events`, {
      headers: { Accept: 'text/event-stream' }
    });
    
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });
});
```

### Web Test Runner Plugin (`support/mock-web-test-runner-plugin.js`)

Plugin for integrating with Web Test Runner for browser-based testing.

**Configuration:**
```javascript
// web-test-runner.config.js
import { mockApiPlugin } from './test/lib/mock-api/support/mock-web-test-runner-plugin.js';

export default {
  plugins: [
    mockApiPlugin,
    // other plugins...
  ],
};
```

**Cross-Environment Testing:**

The real power of this mock API system is **environment transparency**. When you combine the Web Test Runner plugin with the mock test hooks, your test code remains identical whether running in Node.js or the browser.

```javascript
// This EXACT same test code works in both Node.js and browser:
import { mockTestHooks } from './support/mock-test-hooks.js';

describe('API Tests', () => {
  const hooks = mockTestHooks();
  let mockCtrl;

  before(async () => {
    mockCtrl = await hooks.before(); // Automatically detects environment
  });

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  after(() => {
    hooks.after();
  });

  it('works everywhere', async () => {
    // Same code, different environments!
    const users = await mockCtrl.mock()
      .when({ method: 'GET', path: '/api/users' })
      .respond({ status: 200, body: [{ id: 1, name: 'John' }] })
      .thenCall(() => fetch('/api/users').then(r => r.json()));
    
    expect(users).toHaveLength(1);
  });
});
```

**Behind the scenes:**
- **Node.js**: Starts real HTTP servers on free ports
- **Browser**: Connects to proxy routes provided by the Web Test Runner plugin
- **Your code**: Stays exactly the same!

This eliminates the need for environment-specific test code and ensures your tests behave consistently across all environments.
