// Ambient module declarations for `git-http-mock-server` (no types shipped upstream).
// We only consume the middleware factory and CORS wrapper; both are typed loosely
// because the package's runtime shape is dynamic CGI plumbing.

declare module 'git-http-mock-server/middleware.js' {
  import type { IncomingMessage, ServerResponse } from 'node:http';

  interface MiddlewareConfig {
    root: string;
    route: string;
    glob?: string;
  }

  // Connect-style middleware: `(req, res, next?)`. `next` is invoked when the path
  // doesn't match a known git endpoint so the host server can fall through.
  type Middleware = (req: IncomingMessage, res: ServerResponse, next?: () => void) => void;

  function factory(config: MiddlewareConfig): Middleware;
  export default factory;
}

declare module 'git-http-mock-server/cors.js' {
  import type { RequestListener } from 'node:http';

  function cors(handler: RequestListener): RequestListener;
  export default cors;
}
