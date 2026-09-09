import { shutdown } from '@clevercloud/scribe';

let shuttingDown = false;

/**
 * Flush logger buffers, then terminate the process. Idempotent — repeated calls
 * are ignored once a shutdown is in progress.
 * @param {number} code
 * @returns {Promise<never>}
 */
export async function exit(code) {
  if (shuttingDown) {
    return new Promise(() => {});
  }
  shuttingDown = true;
  try {
    await shutdown();
  } catch {
    // best-effort flush — never block exit on a logger failure
  }
  process.exit(code);
}
