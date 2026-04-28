export interface CliRunnerOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  expectExitCode: number | null;
  stdin: string | Buffer | null;
  interactions: CliInteraction[] | null;
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
