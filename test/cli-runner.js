import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stripAnsiLib from 'strip-ansi';

/**
 * @typedef {import('./cli-runner.types.js').CliRunnerOptions} CliRunnerOptions
 * @typedef {import('./cli-runner.types.js').CliInteraction} CliInteraction
 * @typedef {import('./cli-runner.types.js').CliResult} CliResult
 *
 * @typedef {object} RunCommonArgs
 * @property {string} file
 * @property {string[]} fileArgs
 * @property {string} workingDir
 * @property {Record<string, string>} env
 * @property {number} timeout
 * @property {string | Buffer | null} stdin
 * @property {CliInteraction[] | null} interactions
 * @property {boolean} stripAnsi
 *
 * @typedef {RunCommonArgs & { cliBin: string }} RunUnderPipesArgs
 * @typedef {RunCommonArgs & { cols: number, rows: number }} RunUnderPtyArgs
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
  pty: false,
  cols: 120,
  rows: 30,
};
const DEFAULT_INTERACTION_TIMEOUT_MS = 5000;

/**
 * Run the CLI binary with the given arguments
 * @param {string[]} args - CLI arguments
 * @param {Partial<CliRunnerOptions>} [options] - Options
 * @returns {Promise<CliResult>}
 */
export async function runCli(args, options = {}) {
  const { env, cwd, timeout, expectExitCode, stdin, interactions, stripAnsi, pty, cols, rows } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const workingDir = cwd ?? PROJECT_ROOT;

  const isNativeBin = process.env.CLEVER_BIN != null;
  const cliBin = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
  const [file, fileArgs] = isNativeBin ? [cliBin, args] : [process.execPath, [cliBin, ...args]];
  console.log(`Running CLI command`, { cwd: workingDir, cmd: [file, fileArgs], env, stdin, interactions, pty });

  const result = pty
    ? await runUnderPty({ file, fileArgs, workingDir, env, timeout, cols, rows, stdin, interactions, stripAnsi })
    : await runUnderPipes({ file, fileArgs, workingDir, env, timeout, stdin, interactions, stripAnsi, cliBin });

  if (expectExitCode != null && result.exitCode !== expectExitCode) {
    throw new Error(
      `CLI exited with ${result.exitCode} (expected ${expectExitCode})\n` +
        `args: ${JSON.stringify(args)}\n` +
        `--- stdout ---\n${result.stdout}\n` +
        `--- stderr ---\n${result.stderr}\n` +
        `--- output ---\n${result.output}\n` +
        `------`,
    );
  }

  return result;
}

/**
 * Pipe-mode runner: spawn the CLI with piped stdio and capture stdout/stderr separately.
 * This is the default. Existing tests rely on the stdout/stderr split.
 *
 * @param {RunUnderPipesArgs} args
 * @returns {Promise<CliResult>}
 */
async function runUnderPipes({ file, fileArgs, workingDir, env, timeout, stdin, interactions, stripAnsi, cliBin }) {
  return new Promise((resolveResult, rejectResult) => {
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
            `Interaction timed out after ${ms}ms waiting for ${re}\n` + `--- output so far ---\n${combined}\n------`,
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
      const trimmedStdout = finalStdout.trim();
      const trimmedStderr = finalStderr.trim();
      const output =
        trimmedStderr.length > 0
          ? trimmedStdout.length > 0
            ? `${trimmedStdout}\n${trimmedStderr}`
            : trimmedStderr
          : trimmedStdout;
      resolveResult({ stdout: trimmedStdout, stderr: trimmedStderr, output, exitCode });
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
}

/**
 * PTY-mode runner: spawn the CLI under a pseudo-terminal so raw-mode prompts
 * (select / checkbox / confirm via @inquirer/prompts) can be driven.
 *
 * The PTY model has only one channel between parent and child: stdout and
 * stderr merge into a single stream by design (see Microsoft node-pty issue #71).
 * Under PTY mode `result.output` carries the merged ANSI-stripped stream, and
 * `result.stdout` / `result.stderr` are empty strings.
 *
 * @param {RunUnderPtyArgs} args
 * @returns {Promise<CliResult>}
 */
async function runUnderPty({ file, fileArgs, workingDir, env, timeout, cols, rows, stdin, interactions, stripAnsi }) {
  // Lazy-load node-pty so pipe-mode tests don't pay the native module cost.
  const ptyMod = await import('node-pty');
  const ptyApi = ptyMod.default ?? ptyMod;

  return new Promise((resolveResult, rejectResult) => {
    const ptyProcess = ptyApi.spawn(file, fileArgs, {
      cwd: workingDir,
      env: { ...process.env, ...env },
      name: 'xterm-256color',
      cols,
      rows,
      handleFlowControl: false,
    });

    let raw = '';
    let combined = '';
    /** @type {CliInteraction[]} */
    const queue = Array.isArray(interactions) ? [...interactions] : [];
    /** @type {NodeJS.Timeout | null} */
    let stepTimer = null;
    let outputSliceFrom = -1;
    let exited = false;

    const overallTimer = setTimeout(() => {
      try {
        ptyProcess.kill('SIGKILL');
      } catch (_e) {
        // process may already be gone
      }
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
        try {
          ptyProcess.kill('SIGKILL');
        } catch (_e) {
          // ignored
        }
        rejectResult(
          new Error(
            `Interaction timed out after ${ms}ms waiting for ${re}\n` + `--- output so far ---\n${combined}\n------`,
          ),
        );
      }, ms);
    }

    /** @param {string} data */
    function tryWrite(data) {
      if (exited) return;
      try {
        ptyProcess.write(data);
      } catch (_e) {
        // child may have exited
      }
    }

    function processBuffer() {
      while (queue.length > 0) {
        const next = queue[0];
        if (!next.waitFor.test(combined)) break;
        queue.shift();
        clearStepTimer();
        tryWrite(next.send);
        if (queue.length > 0) {
          armStepTimer();
        } else {
          // Last answer sent: mark slice point so result.output drops everything
          // emitted while prompts were active.
          outputSliceFrom = raw.length;
        }
      }
    }

    ptyProcess.onData((chunk) => {
      raw += chunk;
      combined += stripAnsiLib(chunk);
      processBuffer();
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      exited = true;
      clearTimeout(overallTimer);
      clearStepTimer();
      if (queue.length > 0) {
        rejectResult(
          new Error(
            `CLI exited before all interactions ran (${queue.length} remaining)\n` + `--- output ---\n${raw}\n------`,
          ),
        );
        return;
      }
      const code = typeof exitCode === 'number' ? exitCode : signal != null ? 1 : 0;
      const slicedRaw = outputSliceFrom >= 0 ? raw.slice(outputSliceFrom) : raw;
      // PTYs translate '\n' -> '\r\n'; normalize so assertions look natural.
      const normalized = slicedRaw.replace(/\r\n/g, '\n');
      const finalOutput = stripAnsi ? stripAnsiLib(normalized) : normalized;
      resolveResult({ stdout: '', stderr: '', output: finalOutput.trim(), exitCode: code });
    });

    if (queue.length === 0) {
      // No prompts to drive: write any upfront stdin, then send EOF (Ctrl-D).
      if (stdin != null) tryWrite(typeof stdin === 'string' ? stdin : stdin.toString('utf8'));
      tryWrite('\x04');
    } else {
      if (stdin != null) tryWrite(typeof stdin === 'string' ? stdin : stdin.toString('utf8'));
      armStepTimer();
    }
  });
}
