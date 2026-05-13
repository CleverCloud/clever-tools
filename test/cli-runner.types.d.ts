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
  exitCode: number;
}
