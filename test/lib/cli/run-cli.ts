import { spawn } from 'node:child_process';
import { isKey, type Key } from './keys.ts';
import { renderTerminalScreen } from './terminal-screen.ts';

/** Text to type, or a key of `KEYS`. */
export type CliInput = string | Key;

/** Answer to a prompt: once the output shows `waitFor`, type `send`. */
export interface CliInteraction {
  /** Text (or pattern) the output must show, after the previous answer, before `send` is typed. */
  waitFor: string | RegExp;
  /**
   * What to type: a text (`'my-app\n'`), a key (`KEYS.CTRL_C`), or several of them in a row. An empty list types
   * nothing: as the last interaction, it closes stdin once the prompt shows, like a user ending the input.
   */
  send: CliInput | Array<CliInput>;
}

export interface RunCliOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  stdin: string | Buffer | null;
  /**
   * Prompts to answer, in order. Without a key to send, stdin stays a pipe, left open until the last answer.
   * With a key, the command runs in a terminal (see `RunCliResult.terminal`).
   */
  interactions: Array<CliInteraction>;
  /** How long each prompt of `interactions` can take to show up, in milliseconds. */
  interactionTimeout: number;
}

export interface RunCliResult {
  /** Without `interactions`, the output as written. With them, the screen it leaves (see `renderTerminalScreen()`). */
  stdout: string;
  /** Same as `stdout`. */
  stderr: string;
  /**
   * `stdout` and `stderr` joined by a newline (whichever are non-empty). In a terminal, the screen the command
   * leaves, stdout and stderr mixed, since a terminal has a single output.
   */
  output: string;
  exitCode: number;
  /** True if the command was killed because it exceeded `timeout`. The outputs hold what it wrote until then. */
  timedOut: boolean;
  /** PID of the command. After a timeout, the process may still be dying when the result is returned. */
  pid: number;
  /** True if the command ran in a terminal, because a key was sent: `stdout` and `stderr` are then empty. */
  terminal: boolean;
}

const DEFAULT_OPTIONS: RunCliOptions = {
  env: {},
  cwd: process.cwd(),
  timeout: 30000,
  stdin: null,
  interactions: [],
  // Prompts follow API calls answered by a local mock: 5 s is generous.
  interactionTimeout: 5000,
};

/** Size of the terminal, as wide as the `CLI_WIDTH` of the sandbox. */
const TERMINAL_COLUMNS = 200;
const TERMINAL_ROWS = 50;

/**
 * Run any program with the given arguments, with piped stdio, or in a terminal when an interaction sends a key.
 * The env is hermetic: only `options.env` is passed to the child.
 * Never throws on a non-zero exit code or on a timeout: asserting `exitCode` and `timedOut` is up to the caller.
 * Throws when a prompt of `interactions` does not show up, with the output so far.
 */
export async function runCli(
  file: string,
  args: string[],
  options: Partial<RunCliOptions> = {},
): Promise<RunCliResult> {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const sendsKey = resolvedOptions.interactions.some((interaction) => toInputs(interaction.send).some(isKey));
  return sendsKey ? runInTerminal(file, args, resolvedOptions) : runWithPipes(file, args, resolvedOptions);
}

function runWithPipes(file: string, args: string[], options: RunCliOptions): Promise<RunCliResult> {
  const { env, cwd, timeout, stdin, interactions, interactionTimeout } = options;

  return new Promise<RunCliResult>((resolveResult, rejectResult) => {
    const child = spawn(file, args, { cwd, env });

    let stdout = '';
    let stderr = '';
    let settled = false;

    // Only the first call counts: a run settles once, on its exit, its timeout or a failed interaction.
    function settle(exitCode: number, timedOut: boolean) {
      if (settled) {
        return;
      }
      settled = true;
      queue.stop();
      const outputs: Promise<Array<string>> =
        interactions.length > 0
          ? Promise.all([renderTerminalScreen(stdout), renderTerminalScreen(stderr)])
          : Promise.resolve([stdout, stderr]);
      outputs.then(([finalStdout, finalStderr]) => {
        const trimmedStdout = finalStdout.trim();
        const trimmedStderr = finalStderr.trim();
        const output = [trimmedStdout, trimmedStderr].filter((part) => part.length > 0).join('\n');
        resolveResult({
          stdout: trimmedStdout,
          stderr: trimmedStderr,
          output,
          exitCode,
          timedOut,
          pid: child.pid as number,
          terminal: false,
        });
      }, rejectResult);
    }

    function fail(error: Error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      queue.stop();
      child.kill('SIGKILL');
      rejectResult(error);
    }

    const queue = new InteractionQueue(interactions, interactionTimeout, {
      type: (text) => child.stdin.write(text),
      // Close stdin after the last answer, so the command never waits for more input.
      done: () => child.stdin.end(),
      fail,
      outputSoFar: () => [stdout, stderr].join('\n'),
    });

    // Resolve right away instead of waiting for 'close': a grandchild holding the pipes open would delay it.
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle(1, true);
    }, timeout);

    // setEncoding decodes through a StringDecoder, so a multi-byte character split across two chunks stays intact.
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      queue.read(chunk);
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
      queue.read(chunk);
    });

    // Swallow EPIPE on stdin once the child exits early; the real cause surfaces via 'close'.
    child.stdin.on('error', () => {});

    child.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        fail(new Error(`Command not found: ${file}`));
        return;
      }
      fail(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const exitCode = typeof code === 'number' ? code : 1;
      if (!queue.isDone()) {
        fail(queue.exitedError(exitCode));
        return;
      }
      settle(exitCode, false);
    });

    if (interactions.length === 0) {
      // Write any upfront stdin, then close it so the command never waits for input.
      child.stdin.end(stdin ?? '');
      return;
    }
    if (stdin != null) {
      child.stdin.write(stdin);
    }
    queue.start();
  });
}

async function runInTerminal(file: string, args: string[], options: RunCliOptions): Promise<RunCliResult> {
  const { env, cwd, timeout, stdin, interactions, interactionTimeout } = options;
  // Loaded on demand: most tests run with pipes and don't need the native module.
  const { spawn: spawnInTerminal } = await import('node-pty');

  return new Promise<RunCliResult>((resolveResult, rejectResult) => {
    const child = spawnInTerminal(file, args, {
      cwd,
      env: { TERM: 'xterm-256color', ...env },
      name: 'xterm-256color',
      cols: TERMINAL_COLUMNS,
      rows: TERMINAL_ROWS,
    });

    let output = '';
    let settled = false;
    let exited = false;

    // Only the first call counts: a run settles once, on its exit, its timeout or a failed interaction.
    function settle(exitCode: number, timedOut: boolean) {
      if (settled) {
        return;
      }
      settled = true;
      queue.stop();
      renderTerminalScreen(output).then((screen) => {
        resolveResult({
          stdout: '',
          stderr: '',
          output: screen.trim(),
          exitCode,
          timedOut,
          pid: child.pid,
          terminal: true,
        });
      }, rejectResult);
    }

    function kill() {
      if (!exited) {
        child.kill('SIGKILL');
      }
    }

    function fail(error: Error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      queue.stop();
      kill();
      rejectResult(error);
    }

    const queue = new InteractionQueue(interactions, interactionTimeout, {
      type: (text) => {
        if (!exited) {
          child.write(text);
        }
      },
      // A terminal stays open: the command reads what it needs, like with a user at the keyboard.
      done: () => {},
      fail,
      outputSoFar: () => output,
    });

    const timer = setTimeout(() => {
      kill();
      settle(1, true);
    }, timeout);

    child.onData((chunk) => {
      output += chunk;
      queue.read(chunk);
    });

    child.onExit(({ exitCode, signal }) => {
      exited = true;
      clearTimeout(timer);
      // Like a shell: a command killed by a signal exits with 128 + its number (130 for SIGINT).
      const code = signal != null && signal > 0 ? 128 + signal : exitCode;
      if (!queue.isDone()) {
        fail(queue.exitedError(code));
        return;
      }
      settle(code, false);
    });

    if (stdin != null) {
      child.write(stdin.toString());
    }
    queue.start();
  });
}

function toInputs(send: CliInteraction['send']): Array<CliInput> {
  return Array.isArray(send) ? send : [send];
}

function describeInteraction(interaction: CliInteraction): string {
  return typeof interaction.waitFor === 'string' ? JSON.stringify(interaction.waitFor) : String(interaction.waitFor);
}

/** Escape sequences (colors, cursor moves), dropped before looking for the text of a prompt. */
// eslint-disable-next-line no-control-regex
const ESCAPE_SEQUENCES = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1B]*(?:\x07|\x1B\\)|[@-Z\\-_])/g;

interface InteractionHandlers {
  /** Type text on the input of the command. */
  type: (text: string) => void;
  /** Called once the last answer has been typed. */
  done: () => void;
  /** Stop the run with this error. */
  fail: (error: Error) => void;
  /** Output of the command so far, for the error messages. */
  outputSoFar: () => string;
}

/** Answer the prompts of `interactions` in order, as their text shows up in the output. */
class InteractionQueue {
  readonly #pending: Array<CliInteraction>;
  readonly #handlers: InteractionHandlers;
  readonly #timeout: number;
  /** Output read so far, without escape sequences. */
  #seen = '';
  /** Position in `#seen` after the last answer: the next prompt is looked for after it. */
  #from = 0;
  #timer: NodeJS.Timeout | undefined;
  /** True between `start()` and the last answer: the output is only watched meanwhile. */
  #active = false;

  constructor(interactions: Array<CliInteraction>, timeout: number, handlers: InteractionHandlers) {
    this.#pending = [...interactions];
    this.#timeout = timeout;
    this.#handlers = handlers;
  }

  start(): void {
    this.#active = true;
    this.#advance();
  }

  read(chunk: string): void {
    this.#seen += chunk.replace(ESCAPE_SEQUENCES, '');
    if (this.#active) {
      this.#advance();
    }
  }

  isDone(): boolean {
    return this.#pending.length === 0;
  }

  stop(): void {
    clearTimeout(this.#timer);
  }

  exitedError(exitCode: number): Error {
    const next = this.#pending[0];
    return new Error(
      [
        `the command exited with code ${exitCode} before showing ${describeInteraction(next)}`,
        `output:\n${this.#handlers.outputSoFar()}`,
      ].join('\n'),
    );
  }

  #advance(): void {
    while (this.#pending.length > 0) {
      const next = this.#pending[0];
      const rest = this.#seen.slice(this.#from);
      const shown =
        typeof next.waitFor === 'string' ? rest.includes(next.waitFor) : new RegExp(next.waitFor).test(rest);
      if (!shown) {
        this.#arm();
        return;
      }
      this.#pending.shift();
      this.#from = this.#seen.length;
      clearTimeout(this.#timer);
      this.#timer = undefined;
      for (const input of toInputs(next.send)) {
        this.#handlers.type(isKey(input) ? input.sequence : input);
      }
    }
    this.#active = false;
    this.#handlers.done();
  }

  /** Start the timeout of the next prompt, once. */
  #arm(): void {
    if (this.#timer != null) {
      return;
    }
    const next = this.#pending[0];
    this.#timer = setTimeout(() => {
      this.#handlers.fail(
        new Error(
          [
            `prompt not shown after ${this.#timeout} ms: ${describeInteraction(next)}`,
            `output so far:\n${this.#handlers.outputSoFar()}`,
          ].join('\n'),
        ),
      );
    }, this.#timeout);
  }
}
