import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const CLI_BIN = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
const IS_NATIVE_BIN = process.env.CLEVER_BIN != null;

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
 * @property {number|null} [expectExitCode] - Expected exit code; throws if the actual code differs. Default 0. Pass `null` to disable the check.
 */

/**
 * Run the clever2.js CLI with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {CliRunnerOptions} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env = {}, cwd = PROJECT_ROOT, timeout = 30000, expectExitCode = 0 } = options;

  let result;
  try {
    delete process.env.FORCE_COLOR;
    const [file, fileArgs] = IS_NATIVE_BIN ? [CLI_BIN, args] : [process.execPath, [CLI_BIN, ...args]];
    console.log(`Running CLI command: ${file} ${fileArgs.join(' ')}`);
    const { stdout, stderr } = await execFileAsync(file, fileArgs, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
    });
    result = { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`CLI binary not found at ${CLI_BIN}`);
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`CLI command timed out after ${timeout}ms`);
    }
    result = {
      stdout: (error.stdout ?? '').trim(),
      stderr: (error.stderr ?? '').trim(),
      exitCode: error.code ?? 1,
    };
  }

  if (expectExitCode != null && result.exitCode !== expectExitCode) {
    throw new Error(
      `CLI exited with ${result.exitCode} (expected ${expectExitCode})\n` +
        `args: ${JSON.stringify(args)}\n` +
        `--- stdout ---\n${result.stdout}\n` +
        `--- stderr ---\n${result.stderr}\n` +
        `------`,
    );
  }

  return result;
}
