import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stripAnsiLib from 'strip-ansi';

export interface CliRunnerOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  expectExitCode: number | null;
  stdin: string | Buffer | null;
  interactions: CliInteraction[] | null;
  /** Strip ANSI escape sequences from the captured stdout/stderr (default: true). */
  stripAnsi: boolean;
  /**
   * Run the CLI under a pseudo-terminal so raw-mode prompts (select / checkbox /
   * confirm via @inquirer/prompts) work. Default: false (uses pipes).
   *
   * Trade-off: PTYs have one channel between parent and child, so stdout and
   * stderr merge into a single stream. Under `pty: true`, assert against
   * `result.output`; `result.stdout` and `result.stderr` are empty strings.
   */
  pty: boolean;
  /** PTY columns (default: 120). Only used when `pty: true`. */
  cols: number;
  /** PTY rows (default: 30). Only used when `pty: true`. */
  rows: number;
}

export interface CliInteraction {
  waitFor: RegExp;
  send: string;
  timeoutMs?: number;
}

export interface CliResult {
  /** Captured stdout (pipe mode only — empty under `pty: true`). */
  stdout: string;
  /** Captured stderr (pipe mode only — empty under `pty: true`). */
  stderr: string;
  /**
   * Combined output. Under pipe mode, `stdout + '\n' + stderr` (whichever are
   * non-empty). Under PTY mode, the merged ANSI-stripped PTY stream. Always
   * populated.
   */
  output: string;
  /**
   * ANSI-stripped output split per interaction. For N interactions, this has
   * N+1 entries: `segments[i]` (i < N) is the output captured between the
   * previous answer (or start) and the moment `interactions[i].waitFor` matched
   * and its answer was sent; `segments[N]` is everything emitted after the last
   * answer. With no interactions, this is a single-element array containing the
   * full stripped output.
   */
  segments: string[];
  exitCode: number;
}

interface RunCommonArgs {
  file: string;
  fileArgs: string[];
  workingDir: string;
  env: Record<string, string>;
  timeout: number;
  stdin: string | Buffer | null;
  interactions: CliInteraction[] | null;
  stripAnsi: boolean;
}

type RunUnderPipesArgs = RunCommonArgs & { cliBin: string };
type RunUnderPtyArgs = RunCommonArgs & { cols: number; rows: number };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const DEFAULT_OPTIONS: CliRunnerOptions = {
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
 * Merge OS-essential env vars into the test's hermetic env. Without `SystemRoot`,
 * the spawned process can't load `bcryptprimitives.dll`, which aborts Node's
 * OpenSSL init at `Assertion failed: ncrypto::CSPRNG`. `child_process.spawn`
 * (libuv) auto-injects `SystemRoot`; node-pty's native CreateProcess does not,
 * so the PTY-mode spawn must propagate it explicitly. Test-provided keys win.
 */
function withOsEnv(env: Record<string, string>): Record<string, string> {
  if (process.platform !== 'win32') {
    return env;
  }
  const passthrough = ['SystemRoot', 'SystemDrive', 'windir', 'TEMP', 'TMP', 'PATHEXT', 'COMSPEC', 'PATH'];
  const osEnv: Record<string, string> = {};
  for (const key of passthrough) {
    if (process.env[key] != null) {
      osEnv[key] = process.env[key] as string;
    }
  }
  return { ...osEnv, ...env };
}

/**
 * Split a buffer at the given boundary offsets, producing `boundaries.length + 1`
 * segments. The last segment runs from the final boundary (or 0) to the end.
 * PTY emits "\r\n" for "\n"; normalize so segments look the same in both modes.
 */
function sliceSegments(buffer: string, boundaries: number[]): string[] {
  const segments: string[] = [];
  let prev = 0;
  for (const b of boundaries) {
    segments.push(buffer.slice(prev, b).replace(/\r\n/g, '\n'));
    prev = b;
  }
  segments.push(buffer.slice(prev).replace(/\r\n/g, '\n'));
  return segments;
}

/**
 * Run the CLI binary with the given arguments.
 */
export async function runCli(args: string[], options: Partial<CliRunnerOptions> = {}): Promise<CliResult> {
  const { env, cwd, timeout, expectExitCode, stdin, interactions, stripAnsi, pty, cols, rows } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const workingDir = cwd ?? PROJECT_ROOT;
  const isNativeBin = process.env.CLEVER_BIN != null;
  const cliBin = process.env.CLEVER_BIN ?? resolve(PROJECT_ROOT, 'bin/clever.js');
  const [file, fileArgs] = isNativeBin ? [cliBin, args] : [process.execPath, [cliBin, ...args]];

  const result = pty
    ? await runUnderPty({ file, fileArgs, workingDir, env, timeout, cols, rows, stdin, interactions, stripAnsi })
    : await runUnderPipes({ file, fileArgs, workingDir, env, timeout, stdin, interactions, stripAnsi, cliBin });

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

/**
 * Pipe-mode runner: spawn the CLI with piped stdio and capture stdout/stderr separately.
 * This is the default. Existing tests rely on the stdout/stderr split.
 */
async function runUnderPipes({
  file,
  fileArgs,
  workingDir,
  env,
  timeout,
  stdin,
  interactions,
  stripAnsi,
  cliBin,
}: RunUnderPipesArgs): Promise<CliResult> {
  return new Promise((resolveResult, rejectResult) => {
    const child = spawn(file, fileArgs, { cwd: workingDir, env: withOsEnv(env) });

    let stdout = '';
    let stderr = '';
    // Concatenated and ANSI-stripped stream of stdout+stderr, used to match interaction patterns.
    // Inquirer renders prompts on stderr, so we watch both streams here.
    let combined = '';
    const queue: CliInteraction[] = Array.isArray(interactions) ? [...interactions] : [];
    let stepTimer: NodeJS.Timeout | null = null;
    // Boundaries in `combined` recorded at each interaction shift; used to split
    // the ANSI-stripped output into per-interaction segments.
    const segmentBoundaries: number[] = [];
    // Once the last interaction has been answered, slice the captured streams from these
    // offsets so result.stdout/stderr only contain what the command itself produced.
    // -1 means "no slice" (no interactions, or the last answer was never sent).
    let stdoutSliceFrom = -1;
    let stderrSliceFrom = -1;
    // After the last answer is sent, the prompt library writes one trailing line
    // (e.g. "✔ Enter your password: *******\n") to whichever stream renders prompts.
    // Skip past the next "\n" we observe on that stream so that line is dropped too.
    let promptEndStream: 'stdout' | 'stderr' | null = null;
    let lastChunkStream: 'stdout' | 'stderr' | null = null;

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

    function tryWriteStdin(data: string | Buffer) {
      try {
        child.stdin.write(data);
      } catch (_e) {
        // Child may have closed stdin already; surfaced via 'close' / 'error'.
      }
    }

    function tryEndStdin(data?: string | Buffer) {
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
        segmentBoundaries.push(combined.length);
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
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
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
      const segments = sliceSegments(combined, segmentBoundaries);
      resolveResult({ stdout: trimmedStdout, stderr: trimmedStderr, output, segments, exitCode });
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
 */
async function runUnderPty({
  file,
  fileArgs,
  workingDir,
  env,
  timeout,
  cols,
  rows,
  stdin,
  interactions,
  stripAnsi,
}: RunUnderPtyArgs): Promise<CliResult> {
  // Lazy-load node-pty so pipe-mode tests don't pay the native module cost.
  const ptyMod: any = await import('node-pty');
  const ptyApi = ptyMod.default ?? ptyMod;

  return new Promise((resolveResult, rejectResult) => {
    // child_process.spawn auto-propagates NODE_V8_COVERAGE even with an explicit env,
    // but node-pty's native spawn doesn't — pass it through manually so c8 sees the
    // subprocess coverage emitted while driving raw-mode prompts.
    const coverageEnv = process.env.NODE_V8_COVERAGE != null ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {};
    const ptyProcess = ptyApi.spawn(file, fileArgs, {
      cwd: workingDir,
      // TERM matches `name` so @inquirer/figures picks Unicode glyphs (❯, ✔) on Windows ConPTY,
      // which otherwise lacks the env hints (WT_SESSION, etc.) is-unicode-supported looks for.
      env: { TERM: 'xterm-256color', ...coverageEnv, ...withOsEnv(env) },
      name: 'xterm-256color',
      cols,
      rows,
    });

    let raw = '';
    let combined = '';
    const queue: CliInteraction[] = Array.isArray(interactions) ? [...interactions] : [];
    let stepTimer: NodeJS.Timeout | null = null;
    const segmentBoundaries: number[] = [];
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

    function tryWrite(data: string) {
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
        segmentBoundaries.push(combined.length);
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

    ptyProcess.onData((chunk: string) => {
      raw += chunk;
      combined += stripAnsiLib(chunk);
      processBuffer();
    });

    ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
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
      const segments = sliceSegments(combined, segmentBoundaries);
      resolveResult({ stdout: '', stderr: '', output: finalOutput.trim(), segments, exitCode: code });
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
