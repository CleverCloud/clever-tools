import type { Mock, MockClient } from '@clevercloud/doublure';
import {
  MockScenario as ApiMockScenario,
  MockScenarioVerifier as ApiMockScenarioVerifier,
} from '@clevercloud/doublure';
import { doublureHooks } from '@clevercloud/doublure/testing';
import fs from 'node:fs';
import path from 'node:path';
import type { CliResult, CliRunnerOptions } from './cli-runner.ts';
import { runCli } from './cli-runner.ts';
import type { FileMockContent } from './mocks/file-system.ts';
import { FileSystem, FileSystemRead } from './mocks/file-system.ts';
import { GitRepo } from './mocks/git-repo.ts';
import type { GitClient, GitServer } from './mocks/git-server.ts';
import { startGitServer } from './mocks/git-server.ts';

type Client = MockClient;

export interface CliHooks {
  before(): Promise<NewCliScenario>;
  beforeEach(): Promise<void>;
  after(): Promise<void>;
}

export type NewCliScenario = (() => CliMockScenario) & {
  readonly mockClient: MockClient;
  readonly gitClient: GitClient;
};

export interface CliHooksOptions {
  enableGit?: boolean;
}

export function cliHooks(options?: CliHooksOptions): CliHooks {
  const apiHooks = doublureHooks();
  const fileSystem = new FileSystem();
  let gitServer: GitServer;

  return {
    ...apiHooks,
    before: async (): Promise<NewCliScenario> => {
      const apiNewScenario = await apiHooks.before();
      const mockClient = apiNewScenario.mockClient;
      if (options?.enableGit) {
        gitServer = await startGitServer();
      }
      const newScenario = () => new CliMockScenario(mockClient, fileSystem, gitServer?.client);
      return Object.assign(newScenario, { mockClient, gitClient: gitServer?.client });
    },
    beforeEach: async () => {
      fileSystem.reset();
      gitServer?.client.reset();
      await apiHooks.beforeEach();
    },
    after: async () => {
      fileSystem.clear();
      await gitServer?.stop();
      await apiHooks.after();
    },
  };
}

export class CliMockScenario extends ApiMockScenario {
  private readonly _fileSystem: FileSystem;
  private readonly _gitClient: GitClient | undefined;

  constructor(mockClient: Client, fileSystem: FileSystem, gitClient: GitClient | undefined) {
    super(mockClient);
    this._fileSystem = fileSystem;
    this._gitClient = gitClient;
  }

  withAppFile(filePath: string, content: FileMockContent) {
    if (path.isAbsolute(filePath)) {
      throw new Error(`path must be relative, got "${filePath}"`);
    }
    if (path.normalize(filePath).split(path.sep)[0] === '..') {
      throw new Error(`path must not escape the app directory, got "${filePath}"`);
    }
    this._fileSystem.addFile({ type: 'app', path: filePath, content });
    return this;
  }

  withAppConfigFile(content: FileMockContent) {
    this._fileSystem.addFile({ type: 'app', path: '.clever.json', content });
    return this;
  }

  withConfigFile(content: FileMockContent) {
    this._fileSystem.addFile({ type: 'config', content });
    return this;
  }

  withExperimentalFeaturesFile(content: FileMockContent) {
    this._fileSystem.addFile({ type: 'experimental-features', content });
    return this;
  }

  withIdsCacheFile(content: FileMockContent) {
    this._fileSystem.addFile({ type: 'ids-cache', content });
    return this;
  }

  withAppGit(appId: string, onSeeded?: (repo: GitRepo) => void) {
    if (this._gitClient == null) {
      throw new Error('Git server not started. Enable git in the test hooks options.');
    }
    this._gitClient.addRepo(appId);
    const repo = new GitRepo(this._gitClient.baseUrl, this._fileSystem.getAppDirectory(), appId);
    if (onSeeded) {
      onSeeded(repo);
    }
    return this;
  }

  thenCall<T>(callback: () => Promise<T>): CliMockScenarioVerifier<T> {
    return new CliMockScenarioVerifier(this._mockClient, this._fileSystem, callback, this._mocks);
  }

  /**
   * Run the CLI binary with the given arguments.
   */
  thenRunCli(args: string[], options: Partial<CliRunnerOptions> = {}): CliMockScenarioVerifier<CliResult> {
    // Capture the test's stack here, synchronously. The async chain from
    // `await scenario.thenRunCli(...)` is broken by a .then() boundary in the
    // verifier's thenable, so an error thrown from runCli during ._toss()
    // would otherwise lose every frame above _toss. Attaching this stack on
    // re-throw points the failure back at the test that called thenRunCli.
    const callSite: { stack: string } = { stack: '' };
    Error.captureStackTrace(callSite, this.thenRunCli);

    const homeDir = this._fileSystem.getHomeDirectory();

    return this.thenCall(async () => {
      const env: Record<string, string> = {
        HOME: homeDir,
        APPDATA: homeDir,
        API_HOST: this._mockClient.baseUrl,
        AUTH_BRIDGE_HOST: this._mockClient.baseUrl,
        CONFIGURATION_FILE: this._fileSystem.getConfigFile(),
        EXPERIMENTAL_FEATURES_FILE: this._fileSystem.getExperimentalFeaturesFile(),
        IDS_CACHE_FILE: this._fileSystem.getIdsCacheFile(),
      };

      const workingDir = fs.existsSync(this._fileSystem.getAppDirectory())
        ? this._fileSystem.getAppDirectory()
        : undefined;

      const opts: Partial<CliRunnerOptions> = {
        cwd: workingDir,
        ...options,
        env: {
          ...env,
          ...options.env,
        },
      };

      try {
        return await runCli(args, opts);
      } catch (err: any) {
        const callerFrames = callSite.stack.split('\n').slice(1).join('\n');
        err.stack = `${err.stack}\n${callerFrames}`;
        throw err;
      }
    });
  }
}

class CliMockScenarioVerifier<T> extends ApiMockScenarioVerifier<T> {
  private readonly _fileSystem: FileSystem;
  private readonly _cliExpectations: Array<() => void> = [];

  constructor(apiMockClient: Client, fileSystemClient: FileSystem, callback: () => Promise<T>, mocks: Mock[]) {
    super(apiMockClient, callback, mocks);
    this._fileSystem = fileSystemClient;
  }

  verifyFiles(verifyCallback: (fileSystemRead: FileSystemRead) => void): CliMockScenarioVerifier<T> {
    const fileSystemRead = new FileSystemRead(this._fileSystem);
    this._cliExpectations.push(() => {
      verifyCallback(fileSystemRead);
    });
    return this;
  }

  async _toss() {
    const result = await super._toss();

    for (const expectation of this._cliExpectations) {
      expectation();
    }

    return result;
  }
}
