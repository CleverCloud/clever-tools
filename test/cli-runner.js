import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

/**
 * @typedef {import('./cli-runner.types.js').CliRunnerOptions} CliRunnerOptions
 * @typedef {import('./cli-runner.types.js').CliResult} CliResult
 */

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const CLI_BIN = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
const IS_NATIVE_BIN = process.env.CLEVER_BIN != null;
/** @type {CliRunnerOptions} */
const DEFAULT_OPTIONS = { env: {}, cwd: PROJECT_ROOT, timeout: 30000, expectExitCode: 0 };

/**
 * Run the CLI binary with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {Partial<CliRunnerOptions>} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env, cwd, timeout, expectExitCode } = { ...DEFAULT_OPTIONS, ...options };

  const workingDir = cwd ?? PROJECT_ROOT;

  let result;
  try {
    const [file, fileArgs] = IS_NATIVE_BIN ? [CLI_BIN, args] : [process.execPath, [CLI_BIN, ...args]];
    console.log(`Running CLI command`, { cwd: workingDir, cmd: [file, fileArgs], env });
    const { stdout, stderr } = await execFileAsync(file, fileArgs, {
      cwd: workingDir,
      env,
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
