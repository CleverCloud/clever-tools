import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stripAnsiLib from 'strip-ansi';

/**
 * @typedef {import('./cli-runner.types.js').CliRunnerOptions} CliRunnerOptions
 * @typedef {import('./cli-runner.types.js').CliInteraction} CliInteraction
 * @typedef {import('./cli-runner.types.js').CliResult} CliResult
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
/** @type {CliRunnerOptions} */
const DEFAULT_OPTIONS = {
  env: {},
  cwd: PROJECT_ROOT,
  timeout: 30000,
  expectExitCode: 0,
  stdin: null,
  interactions: null,
  stripAnsi: true,
};
const DEFAULT_INTERACTION_TIMEOUT_MS = 5000;

/**
 * Run the CLI binary with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {Partial<CliRunnerOptions>} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env, cwd, timeout, expectExitCode, stdin, interactions, stripAnsi } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const workingDir = cwd ?? PROJECT_ROOT;

  const isNativeBin = process.env.CLEVER_BIN != null;
  const cliBin = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
  const [file, fileArgs] = isNativeBin ? [cliBin, args] : [process.execPath, [cliBin, ...args]];
  console.log(`Running CLI command`, { cwd: workingDir, cmd: [file, fileArgs], env, stdin, interactions });

  const result = await new Promise((resolveResult, rejectResult) => {
    const child = spawn(file, fileArgs, { cwd: workingDir, env });

    let stdout = '';
    let stderr = '';
    // Concatenated and ANSI-stripped stream of stdout+stderr, used to match interaction patterns.
    // Inquirer renders prompts on stderr, so we watch both streams here.
    let combined = '';
    /** @type {CliInteraction[]} */
    const queue = Array.isArray(interactions) ? [...interactions] : [];
    /** @type {NodeJS.Timeout | null} */
    let stepTimer = null;
    // Once the last interaction has been answered, slice the captured streams from these
    // offsets so result.stdout/stderr only contain what the command itself produced.
    // -1 means "no slice" (no interactions, or the last answer was never sent).
    let stdoutSliceFrom = -1;
    let stderrSliceFrom = -1;
    // After the last answer is sent, the prompt library writes one trailing line
    // (e.g. "✔ Enter your password: *******\n") to whichever stream renders prompts.
    // Skip past the next "\n" we observe on that stream so that line is dropped too.
    /** @type {'stdout' | 'stderr' | null} */
    let promptEndStream = null;
    /** @type {'stdout' | 'stderr' | null} */
    let lastChunkStream = null;

    const overallTimer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectResult(new Error(`CLI command timed out after ${timeout}ms`));
    }, timeout);

    function clearStepTimer() {
      if (stepTimer != null) {
        clearTimeout(stepTimer);
        stepTimer = null;
      }
    }

    function armStepTimer() {
      clearStepTimer();
      if (queue.length === 0) return;
      const ms = queue[0].timeoutMs ?? DEFAULT_INTERACTION_TIMEOUT_MS;
      stepTimer = setTimeout(() => {
        const re = queue[0]?.waitFor;
        child.kill('SIGKILL');
        rejectResult(
          new Error(
            `Interaction timed out after ${ms}ms waiting for ${re}\n` +
              `--- output so far ---\n${combined}\n------`,
          ),
        );
      }, ms);
    }

    /** @param {string | Buffer} data */
    function tryWriteStdin(data) {
      try {
        child.stdin.write(data);
      } catch (_e) {
        // Child may have closed stdin already; surfaced via 'close' / 'error'.
      }
    }

    /** @param {string | Buffer} [data] */
    function tryEndStdin(data) {
      try {
        child.stdin.end(data);
      } catch (_e) {
        // ignored
      }
    }

    function processBuffer() {
      while (queue.length > 0) {
        const next = queue[0];
        if (!next.waitFor.test(combined)) break;
        queue.shift();
        clearStepTimer();
        tryWriteStdin(next.send);
        if (queue.length > 0) {
          armStepTimer();
        } else {
          // Last answer sent: mark current positions; everything after is the command's
          // own output (modulo the trailing prompt confirmation that the prompt library
          // emits on the same stream that rendered the prompt).
          stdoutSliceFrom = stdout.length;
          stderrSliceFrom = stderr.length;
          promptEndStream = lastChunkStream;
          tryEndStdin();
        }
      }
    }

    function advancePromptEndMarker() {
      if (promptEndStream === 'stdout') {
        const idx = stdout.indexOf('\n', stdoutSliceFrom);
        if (idx >= 0) {
          stdoutSliceFrom = idx + 1;
          promptEndStream = null;
        }
      } else if (promptEndStream === 'stderr') {
        const idx = stderr.indexOf('\n', stderrSliceFrom);
        if (idx >= 0) {
          stderrSliceFrom = idx + 1;
          promptEndStream = null;
        }
      }
    }

    child.stdout.on('data', (buf) => {
      const text = buf.toString();
      stdout += text;
      combined += stripAnsiLib(text);
      lastChunkStream = 'stdout';
      processBuffer();
      advancePromptEndMarker();
    });
    child.stderr.on('data', (buf) => {
      const text = buf.toString();
      stderr += text;
      combined += stripAnsiLib(text);
      lastChunkStream = 'stderr';
      processBuffer();
      advancePromptEndMarker();
    });

    // Swallow EPIPE on stdin once the child exits early; the real cause surfaces via 'close'.
    child.stdin.on('error', () => {});

    child.on('error', (err) => {
      clearTimeout(overallTimer);
      clearStepTimer();
      if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
        rejectResult(new Error(`CLI binary not found at ${cliBin}`));
        return;
      }
      rejectResult(err);
    });

    child.on('close', (code) => {
      clearTimeout(overallTimer);
      clearStepTimer();
      if (queue.length > 0) {
        rejectResult(
          new Error(
            `CLI exited before all interactions ran (${queue.length} remaining)\n` +
              `--- stdout ---\n${stdout.trim()}\n` +
              `--- stderr ---\n${stderr.trim()}\n------`,
          ),
        );
        return;
      }
      const exitCode = typeof code === 'number' ? code : 1;
      const slicedStdout = stdoutSliceFrom >= 0 ? stdout.slice(stdoutSliceFrom) : stdout;
      const slicedStderr = stderrSliceFrom >= 0 ? stderr.slice(stderrSliceFrom) : stderr;
      const finalStdout = stripAnsi ? stripAnsiLib(slicedStdout) : slicedStdout;
      const finalStderr = stripAnsi ? stripAnsiLib(slicedStderr) : slicedStderr;
      resolveResult({ stdout: finalStdout.trim(), stderr: finalStderr.trim(), exitCode });
    });

    if (queue.length === 0) {
      // No prompts to drive: keep existing behaviour — write any upfront stdin, then close.
      tryEndStdin(stdin ?? '');
    } else {
      // Interactions will close stdin once the queue drains.
      if (stdin != null) {
        tryWriteStdin(stdin);
      }
      armStepTimer();
    }
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
