export interface CliRunnerOptions {
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  expectExitCode: number | null;
}

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
