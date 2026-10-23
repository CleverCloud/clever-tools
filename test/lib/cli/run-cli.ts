import { spawn } from 'node:child_process';

export interface RunCliOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  stdin: string | Buffer | null;
}

export interface RunCliResult {
  stdout: string;
  stderr: string;
  /** `stdout` and `stderr` joined by a newline (whichever are non-empty). */
  output: string;
  exitCode: number;
  /** True if the command was killed because it exceeded `timeout`. `stdout` and `stderr` hold what it wrote until then. */
  timedOut: boolean;
  /** PID of the command. After a timeout, the process may still be dying when the result is returned. */
  pid: number;
}

const DEFAULT_OPTIONS: RunCliOptions = {
  env: {},
  cwd: process.cwd(),
  timeout: 30000,
  stdin: null,
};

/**
 * Run any program with the given arguments, with piped stdio.
 * The env is hermetic: only `options.env` is passed to the child.
 * Never throws on a non-zero exit code or on a timeout: asserting `exitCode` and `timedOut` is up to the caller.
 */
export async function runCli(
  file: string,
  args: string[],
  options: Partial<RunCliOptions> = {},
): Promise<RunCliResult> {
  const { env, cwd, timeout, stdin } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise<RunCliResult>((resolveResult, rejectResult) => {
    const child = spawn(file, args, { cwd, env });

    let stdout = '';
    let stderr = '';

    // Only the first call counts: a promise ignores any later resolve.
    function settle(exitCode: number, timedOut: boolean) {
      const trimmedStdout = stdout.trim();
      const trimmedStderr = stderr.trim();
      const output = [trimmedStdout, trimmedStderr].filter((part) => part.length > 0).join('\n');
      resolveResult({
        stdout: trimmedStdout,
        stderr: trimmedStderr,
        output,
        exitCode,
        timedOut,
        pid: child.pid as number,
      });
    }

    // Resolve right away instead of waiting for 'close': a grandchild holding the pipes open would delay it.
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle(1, true);
    }, timeout);

    // setEncoding decodes through a StringDecoder, so a multi-byte character split across two chunks stays intact.
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    // Swallow EPIPE on stdin once the child exits early; the real cause surfaces via 'close'.
    child.stdin.on('error', () => {});

    child.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        rejectResult(new Error(`Command not found: ${file}`));
        return;
      }
      rejectResult(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      settle(typeof code === 'number' ? code : 1, false);
    });

    // Write any upfront stdin, then close it so the command never waits for input.
    child.stdin.end(stdin ?? '');
  });
}
