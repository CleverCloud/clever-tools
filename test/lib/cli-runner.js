import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

/**
 * @typedef {Object} CliResult
 * @property {string} stdout - Standard output as a string
 * @property {string} stderr - Standard error as a string
 * @property {number} exitCode - Exit status code
 */

/**
 * @typedef {Object} CliRunnerOptions
 * @property {Record<string, string>} [env] - Environment variables to set (merged with process.env)
 * @property {string} [cwd] - Working directory for the command
 * @property {number} [timeout] - Timeout in milliseconds (default: 30000)
 */

/**
 * Run the clever2.js CLI with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {CliRunnerOptions} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env = {}, cwd = PROJECT_ROOT, timeout = 30000 } = options;

  const cliBin = resolve(PROJECT_ROOT, 'bin/clever2.js');
  // const cliBin = 'clever';

  try {
    delete process.env.FORCE_COLOR;
    const { stdout, stderr } = await execFileAsync(cliBin, args, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
    });
    return { stdout: stdout.trim(), stderr, exitCode: 0 };
  } catch (error) {
    // execFile rejects on non-zero exit code, extract the result
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`CLI command timed out after ${timeout}ms`);
    }
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.code ?? 1,
    };
  }
}
