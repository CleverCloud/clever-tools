import {
  MockScenario as ApiMockScenario,
  MockScenarioVerifier as ApiMockScenarioVerifier,
} from '@clevercloud/doublure';
import { doublureHooks } from '@clevercloud/doublure/testing';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCli } from './cli-runner.js';

/**
 * @typedef {import('./cli-hooks.types.js').CliHooks} CliHooks
 * @typedef {import('./cli-hooks.types.js').FileMock} FileMock
 * @typedef {import('./cli-hooks.types.js').FileMockContent} FileMockContent
 * @typedef {import('./cli-runner.types.js').CliRunnerOptions} CliRunnerOptions
 * @typedef {import('./cli-runner.types.js').CliResult} CliResult
 * @typedef {import('@clevercloud/doublure').MockClient} Client
 * @typedef {import('@clevercloud/doublure').Mock} Mock
 */

/**
 * @returns {CliHooks}
 */
export function cliHooks() {
  const apiHooks = doublureHooks();
  const fileSystemClient = new FileSystemClient();
  return {
    ...apiHooks,
    /**
     * @returns {Promise<import('./cli-hooks.types.js').NewCliScenario>}
     */
    before: async () => {
      const apiNewScenario = await apiHooks.before();
      const mockClient = apiNewScenario.mockClient;
      const newScenario = () => new CliMockScenario(mockClient, fileSystemClient);
      return Object.assign(newScenario, { mockClient });
    },
    beforeEach: async () => {
      fileSystemClient.reset();
      await apiHooks.beforeEach();
    },
    after: async () => {
      fileSystemClient.reset();
      await apiHooks.after();
    },
  };
}

export class CliMockScenario extends ApiMockScenario {
  /** @type {FileSystemClient} */
  #fileSystemClient;
  /** @type {Array<FileMock>} */
  #fileMocks = [];

  /**
   * @param {Client} mockClient
   * @param {FileSystemClient} fileSystemClient
   */
  constructor(mockClient, fileSystemClient) {
    super(mockClient);
    this.#fileSystemClient = fileSystemClient;
  }

  /**
   * @param {string} filePath
   * @param {FileMockContent} content
   */
  withAppFile(filePath, content) {
    if (path.isAbsolute(filePath)) {
      throw new Error(`path must be relative, got "${filePath}"`);
    }
    // todo: disallow to go to previous path ('../../../xxx')
    this.#fileMocks.push({ type: 'app', path: filePath, content });
    return this;
  }

  /**
   * @param {FileMockContent} content
   */
  withAppConfigFile(content) {
    this.#fileMocks.push({ type: 'app', path: '.clever.json', content });
    return this;
  }

  /**
   * @param {FileMockContent} content
   */
  withConfigFile(content) {
    this.#fileMocks.push({ type: 'config', content });
    return this;
  }

  /**
   * @param {FileMockContent} content
   */
  withExperimentalFeaturesFile(content) {
    this.#fileMocks.push({ type: 'experimental-features', content });
    return this;
  }

  /**
   * @param {() => Promise<T>} callback
   * @returns {CliMockScenarioVerifier<T>}
   * @template T
   */
  thenCall(callback) {
    return new CliMockScenarioVerifier(
      this._mockClient,
      this.#fileSystemClient,
      callback,
      this._mocks,
      this.#fileMocks,
    );
  }

  /**
   * Run the CLI binary with the given arguments
   * @param {string[]} args - CLI arguments
   * @param {Partial<CliRunnerOptions>} [options] - Options
   * @returns {CliMockScenarioVerifier<CliResult>}
   */
  thenRunCli(args, options = {}) {
    return this.thenCall(async () => {
      /** @type {Record<string, string>} */
      const env = {
        API_HOST: this._mockClient.baseUrl,
        AUTH_BRIDGE_HOST: this._mockClient.baseUrl,
        CONFIGURATION_FILE: this.#fileSystemClient.getConfigFile(),
        EXPERIMENTAL_FEATURES_FILE: this.#fileSystemClient.getExperimentalFeaturesFile(),
      };

      const workingDir = fs.existsSync(this.#fileSystemClient.getAppDirectory())
        ? this.#fileSystemClient.getAppDirectory()
        : undefined;

      /** @type {Partial<CliRunnerOptions>} */
      const opts = {
        cwd: workingDir,
        ...options,
        env: {
          ...env,
          ...options.env,
        },
      };

      return runCli(args, opts);
    });
  }
}

/**
 * @template T
 * @extends ApiMockScenarioVerifier<T>
 */
class CliMockScenarioVerifier extends ApiMockScenarioVerifier {
  /** @type {FileSystemClient} */
  #fileSystemClient;
  /** @type {Array<FileMock>} */
  #fileMocks;
  /** @type {Array<() => void>} */
  #cliExpectations = [];

  /**
   * @param {Client} apiMockClient
   * @param {FileSystemClient} fileSystemClient
   * @param {() => Promise<T>} callback
   * @param {Array<Mock>} mocks
   * @param {Array<FileMock>} fileMocks
   */
  constructor(apiMockClient, fileSystemClient, callback, mocks, fileMocks) {
    super(apiMockClient, callback, mocks);
    this.#fileSystemClient = fileSystemClient;
    this.#fileMocks = fileMocks;
  }

  /**
   * @param {(fileSystemRead:FileSystemRead) => void} verifyCallback
   * @returns {CliMockScenarioVerifier<T>}
   */
  verifyFiles(verifyCallback) {
    const fileSystemRead = new FileSystemRead(this.#fileSystemClient);
    this.#cliExpectations.push(() => {
      verifyCallback(fileSystemRead);
    });
    return this;
  }

  async _toss() {
    if (this.#fileMocks.length > 0) {
      this.#fileMocks.forEach((fileMock) => {
        this.#fileSystemClient.addFile(fileMock);
      });
    }

    const result = await super._toss();

    for (const expectation of this.#cliExpectations) {
      expectation();
    }

    return result;
  }
}

class FileSystemRead {
  /** @type {FileSystemClient} */
  #fileSystemClient;

  /**
   * @param {FileSystemClient} fileSystemClient
   */
  constructor(fileSystemClient) {
    this.#fileSystemClient = fileSystemClient;
  }

  /**
   * @param {string} relativePath
   * @returns {string}
   */
  readAppFile(relativePath) {
    if (path.isAbsolute(relativePath)) {
      throw new Error(`path must be relative, got "${relativePath}"`);
    }
    const appDirectory = this.#fileSystemClient.getAppDirectory();
    if (appDirectory == null) {
      throw new Error('app directory does not exist yet — seed it with withAppFile or withAppConfigFile first');
    }
    const resolved = path.resolve(appDirectory, relativePath);
    if (resolved !== appDirectory && !resolved.startsWith(appDirectory + path.sep)) {
      throw new Error(`path escapes app directory: "${relativePath}"`);
    }
    return fs.readFileSync(resolved, 'utf-8');
  }

  /**
   * @param {string} relativePath
   * @returns {any}
   */
  readAppFileAsObject(relativePath) {
    const str = this.readAppFile(relativePath);
    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Failed to parse JSON file "${relativePath}": ${e.message}`);
    }
  }

  readAppConfigFile() {
    return this.readAppFileAsObject('.clever.json');
  }

  readConfigFile() {
    const file = this.#fileSystemClient.getConfigFile();
    if (file == null) {
      throw new Error('config file does not exist yet — seed it with withConfigFile');
    }
    const str = fs.readFileSync(file, 'utf-8');
    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Failed to parse JSON file "${file}": ${e.message}`);
    }
  }

  readExperimentalFeaturesFile() {
    const file = this.#fileSystemClient.getExperimentalFeaturesFile();
    if (file == null) {
      throw new Error('experimental features file does not exist yet — seed it with withExperimentalFeaturesFile');
    }
    const str = fs.readFileSync(file, 'utf-8');
    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Failed to parse JSON file "${file}": ${e.message}`);
    }
  }
}

const APP_DIR = 'app';
const CONFIG_DIR = 'config';
const CONFIG_FILE = 'clever-tools.json';
const EXPERIMENTAL_FEATURES_FILE = 'clever-tools-experimental-features.json';

class FileSystemClient {
  /** @type {string} */
  #workDirectory;

  constructor() {
    this.#workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-test-'));
  }

  getAppDirectory() {
    return path.resolve(this.#workDirectory, APP_DIR);
  }

  getConfigFile() {
    return path.resolve(this.#workDirectory, `${CONFIG_DIR}/${CONFIG_FILE}`);
  }

  getExperimentalFeaturesFile() {
    return path.resolve(this.#workDirectory, `${CONFIG_DIR}/${EXPERIMENTAL_FEATURES_FILE}`);
  }

  /**
   * @param {FileMock} fileMock
   */
  addFile(fileMock) {
    let filePath;
    if (fileMock.type === 'config') {
      const configDir = path.resolve(this.#workDirectory, CONFIG_DIR);
      this.#createDirIfNotExists(configDir);
      filePath = path.resolve(configDir, CONFIG_FILE);
    } else if (fileMock.type === 'experimental-features') {
      const configDir = path.resolve(this.#workDirectory, CONFIG_DIR);
      this.#createDirIfNotExists(configDir);
      filePath = path.resolve(configDir, EXPERIMENTAL_FEATURES_FILE);
    } else {
      const appDir = path.resolve(this.#workDirectory, APP_DIR);
      filePath = path.resolve(appDir, fileMock.path);
      this.#createDirIfNotExists(path.dirname(filePath));
    }

    const content = typeof fileMock.content === 'object' ? JSON.stringify(fileMock.content, null, 2) : fileMock.content;
    fs.writeFileSync(filePath, content ?? '');
  }

  reset() {
    fs.rmSync(this.#workDirectory, { recursive: true, force: true });
    this.#workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-test-'));
  }

  /**
   * @param {string} dirPath
   */
  #createDirIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
