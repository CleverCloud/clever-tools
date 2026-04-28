import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {import('./cli-runner.types.js').CliRunnerOptions} CliRunnerOptions
 * @typedef {import('./cli-runner.types.js').CliResult} CliResult
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const CLI_BIN = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
const IS_NATIVE_BIN = process.env.CLEVER_BIN != null;
/** @type {CliRunnerOptions} */
const DEFAULT_OPTIONS = { env: {}, cwd: PROJECT_ROOT, timeout: 30000, expectExitCode: 0, stdin: null };

/**
 * Run the CLI binary with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {Partial<CliRunnerOptions>} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env, cwd, timeout, expectExitCode, stdin } = { ...DEFAULT_OPTIONS, ...options };

  const workingDir = cwd ?? PROJECT_ROOT;

  const [file, fileArgs] = IS_NATIVE_BIN ? [CLI_BIN, args] : [process.execPath, [CLI_BIN, ...args]];
  console.log(`Running CLI command`, { cwd: workingDir, cmd: [file, fileArgs], env, stdin });

  const result = await new Promise((resolveResult) => {
    const child = execFile(file, fileArgs, { cwd: workingDir, env, timeout }, (error, stdout, stderr) => {
      if (error == null) {
        resolveResult({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 });
        return;
      }
      if (error.code === 'ENOENT') {
        throw new Error(`CLI binary not found at ${CLI_BIN}`);
      }
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`CLI command timed out after ${timeout}ms`);
      }
      resolveResult({
        stdout: (stdout ?? '').trim(),
        stderr: (stderr ?? '').trim(),
        exitCode: typeof error.code === 'number' ? error.code : 1,
      });
    });

    // Always close stdin so commands that read from it (e.g. `env import`) don't hang.
    child.stdin?.end(stdin ?? '');
  });

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
