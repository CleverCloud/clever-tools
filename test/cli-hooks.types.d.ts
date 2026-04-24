import type { CliMockScenario } from './cli-hooks.js';
import type { CliResult, CliRunnerOptions } from './cli-runner.types.js';

export interface CliHooks {
  before(): Promise<CliTestKit>;
  beforeEach(): Promise<void>;
  after(): Promise<void>;
}

export interface CliTestKit {
  newScenario: () => CliMockScenario;
  runCli(args: string[], options?: Partial<CliRunnerOptions>): Promise<CliResult>;
}

export type FileMock = AppFileMock | ConfigFileMock | ExperimentalFeaturesFileMock;

export type FileMockContent = string | object;

export interface AppFileMock {
  type: 'app';
  path: string;
  content: FileMockContent;
}

export interface ConfigFileMock {
  type: 'config';
  content: FileMockContent;
}

export interface ExperimentalFeaturesFileMock {
  type: 'experimental-features';
  content: FileMockContent;
}
