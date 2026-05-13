import net from 'node:net';

/**
 * @typedef {{
 *   url: string,
 *   received: Array<string[]>,
 *   setReply: (command: string, respReply: string) => void,
 *   reset: () => void,
 *   close: () => Promise<void>,
 * }} MockRedisServer
 */

const OK_REPLY = '+OK\r\n';
// ioredis only inspects `loading:` in the INFO reply; absence is treated as ready.
const INFO_REPLY = bulkString('# Server\r\nredis_version:7.0.0\r\nrole:master\r\n');

/**
 * Start a minimal RESP-protocol TCP server for testing the kv command.
 * Handles RESP2 array-of-bulk-strings requests (what ioredis sends).
 *
 * `CLIENT *` and `INFO` are sent by ioredis on connect; they are auto-acknowledged
 * and not recorded in `received`. Every other command is recorded and answered
 * with the scripted reply, falling back to `+OK\r\n`.
 *
 * @returns {Promise<MockRedisServer>}
 */
export async function startMockRedis() {
  /** @type {Map<string, string>} */
  const replies = new Map();
  /** @type {Array<string[]>} */
  const received = [];

  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (true) {
        const frame = parseFrame(buffer);
        if (frame == null) break;
        buffer = buffer.subarray(frame.end);

        const [verb, ...rest] = frame.args;
        const upper = verb.toUpperCase();

        if (upper === 'CLIENT') {
          socket.write(OK_REPLY);
          continue;
        }
        if (upper === 'INFO') {
          socket.write(INFO_REPLY);
          continue;
        }

        received.push([verb, ...rest]);
        const fullKey = [upper, ...rest].join(' ');
        const reply = replies.get(fullKey) ?? replies.get(upper) ?? OK_REPLY;
        socket.write(reply);
      }
    });
    socket.on('error', () => {});
  });

  await /** @type {Promise<void>} */ (
    new Promise((resolve) => server.listen({ port: 0, host: '127.0.0.1' }, () => resolve()))
  );
  const { port } = /** @type {net.AddressInfo} */ (server.address());

  return {
    url: `redis://127.0.0.1:${port}`,
    received,
    setReply(command, respReply) {
      const [verb, ...rest] = command.split(' ');
      const key = [verb.toUpperCase(), ...rest].join(' ');
      replies.set(key, respReply);
    },
    reset() {
      replies.clear();
      received.length = 0;
    },
    async close() {
      await /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
      );
    },
  };
}

/**
 * Parse one RESP array-of-bulk-strings frame.
 * @param {Buffer} buf
 * @returns {{ args: string[], end: number } | null}
 */
function parseFrame(buf) {
  if (buf.length === 0 || buf[0] !== 0x2a /* '*' */) return null;
  const eol = buf.indexOf('\r\n');
  if (eol === -1) return null;
  const count = Number.parseInt(buf.toString('ascii', 1, eol), 10);
  let pos = eol + 2;
  /** @type {string[]} */
  const args = [];
  for (let i = 0; i < count; i++) {
    if (buf.length <= pos || buf[pos] !== 0x24 /* '$' */) return null;
    const lenEnd = buf.indexOf('\r\n', pos);
    if (lenEnd === -1) return null;
    const len = Number.parseInt(buf.toString('ascii', pos + 1, lenEnd), 10);
    pos = lenEnd + 2;
    if (buf.length < pos + len + 2) return null;
    args.push(buf.toString('utf8', pos, pos + len));
    pos += len + 2;
  }
  return { args, end: pos };
}

/**
 * @param {string} s
 * @returns {string}
 */
function bulkString(s) {
  return `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
}
