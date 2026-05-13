import type { MockClient } from '@clevercloud/doublure';
import type { CliMockScenario } from './cli-hooks.js';

export interface CliHooks {
  before(): Promise<NewCliScenario>;
  beforeEach(): Promise<void>;
  after(): Promise<void>;
}

export type NewCliScenario = (() => CliMockScenario) & {
  readonly mockClient: MockClient;
};

export type FileMock = AppFileMock | ConfigFileMock | ExperimentalFeaturesFileMock | IdsCacheFileMock;

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

export interface IdsCacheFileMock {
  type: 'ids-cache';
  content: FileMockContent;
}
