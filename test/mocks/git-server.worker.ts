import { spawn } from 'node:child_process';
import http from 'node:http';
import { parentPort, workerData } from 'node:worker_threads';

const { root } = workerData as { root: string };

const server = http.createServer((req, res) => handle(req, res, root));

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address() as { port: number };
  parentPort?.postMessage({ type: 'ready', port });
});

parentPort?.on('message', (msg) => {
  if (msg?.type === 'close') {
    server.close(() => process.exit(0));
  }
});

function handle(req: http.IncomingMessage, res: http.ServerResponse, projectRoot: string) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const ps = spawn('git', ['http-backend'], {
    env: {
      ...process.env,
      GIT_PROJECT_ROOT: projectRoot,
      // Bypass the per-repo `git-daemon-export-ok` marker file requirement.
      GIT_HTTP_EXPORT_ALL: '1',
      PATH_INFO: url.pathname,
      QUERY_STRING: url.search.slice(1),
      REQUEST_METHOD: req.method ?? 'GET',
      CONTENT_TYPE: (req.headers['content-type'] ?? '') as string,
      CONTENT_LENGTH: (req.headers['content-length'] ?? '') as string,
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  ps.on('error', (err) => fail(res, err));
  req.pipe(ps.stdin);
  pipeCgiResponse(ps.stdout, res);
}

/**
 * Read the CGI header block from `stdout`, apply it to `res`, then pipe the
 * remaining body. CGI headers end at the first blank line (`\r\n\r\n` per
 * spec, but we tolerate `\n\n` for robustness).
 */
function pipeCgiResponse(stdout: NodeJS.ReadableStream, res: http.ServerResponse) {
  let buf = Buffer.alloc(0);
  let headersDone = false;

  const onData = (chunk: Buffer) => {
    buf = Buffer.concat([buf, chunk]);
    const sep = findHeaderEnd(buf);
    if (sep == null) return;

    const [idx, len] = sep;
    applyCgiHeaders(res, buf.subarray(0, idx).toString('utf-8'));
    const rest = buf.subarray(idx + len);

    headersDone = true;
    stdout.off('data', onData);

    if (rest.length > 0) res.write(rest);
    stdout.pipe(res);
  };

  stdout.on('data', onData);
  stdout.on('end', () => {
    if (!headersDone && !res.headersSent) {
      res.statusCode = 500;
      res.end('git http-backend produced no output\n');
    }
  });
}

function findHeaderEnd(buf: Buffer): [number, number] | null {
  const crlf = buf.indexOf('\r\n\r\n');
  const lf = buf.indexOf('\n\n');
  if (crlf < 0 && lf < 0) return null;
  if (crlf < 0) return [lf, 2];
  if (lf < 0) return [crlf, 4];
  return crlf < lf ? [crlf, 4] : [lf, 2];
}

function applyCgiHeaders(res: http.ServerResponse, block: string) {
  for (const line of block.split(/\r?\n/)) {
    if (line === '') continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    // CGI's `Status:` header maps onto the HTTP status line.
    if (name.toLowerCase() === 'status') {
      const m = /^(\d+)(?:\s+(.*))?$/.exec(value);
      if (m) {
        res.statusCode = Number(m[1]);
        if (m[2]) res.statusMessage = m[2];
      }
    } else {
      res.setHeader(name, value);
    }
  }
}

function fail(res: http.ServerResponse, err: Error) {
  if (res.headersSent) {
    res.destroy(err);
    return;
  }
  res.statusCode = 500;
  res.end(String(err) + '\n');
}
