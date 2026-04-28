export interface CliRunnerOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  expectExitCode: number | null;
  stdin: string | Buffer | null;
  interactions: CliInteraction[] | null;
  /** Strip ANSI escape sequences from the captured stdout/stderr (default: true). */
  stripAnsi: boolean;
}

export interface CliInteraction {
  waitFor: RegExp;
  send: string;
  timeoutMs?: number;
}

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
