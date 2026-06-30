import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

const HOME_DIR = 'home';
const APP_DIR = 'app';
const CONFIG_DIR = 'config';
const CONFIG_FILE = 'clever-tools.json';
const EXPERIMENTAL_FEATURES_FILE = 'clever-tools-experimental-features.json';
const IDS_CACHE_FILE = 'ids-cache.json';

export class FileSystem {
  private readonly _rootDir: string;

  constructor() {
    this._rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-test-'));
  }

  getHomeDirectory() {
    return path.resolve(this._rootDir, HOME_DIR);
  }

  getAppDirectory() {
    return path.resolve(this._rootDir, APP_DIR);
  }

  getConfigFile() {
    return path.resolve(this._rootDir, `${CONFIG_DIR}/${CONFIG_FILE}`);
  }

  getExperimentalFeaturesFile() {
    return path.resolve(this._rootDir, `${CONFIG_DIR}/${EXPERIMENTAL_FEATURES_FILE}`);
  }

  getIdsCacheFile() {
    return path.resolve(this._rootDir, `${CONFIG_DIR}/${IDS_CACHE_FILE}`);
  }

  addFile(fileMock: FileMock) {
    let filePath: string;
    if (fileMock.type === 'config') {
      const configDir = path.resolve(this._rootDir, CONFIG_DIR);
      this.#createDirIfNotExists(configDir);
      filePath = path.resolve(configDir, CONFIG_FILE);
    } else if (fileMock.type === 'experimental-features') {
      const configDir = path.resolve(this._rootDir, CONFIG_DIR);
      this.#createDirIfNotExists(configDir);
      filePath = path.resolve(configDir, EXPERIMENTAL_FEATURES_FILE);
    } else if (fileMock.type === 'ids-cache') {
      const configDir = path.resolve(this._rootDir, CONFIG_DIR);
      this.#createDirIfNotExists(configDir);
      filePath = path.resolve(configDir, IDS_CACHE_FILE);
    } else {
      const appDir = path.resolve(this._rootDir, APP_DIR);
      filePath = path.resolve(appDir, fileMock.path);
      this.#createDirIfNotExists(path.dirname(filePath));
    }

    const content = typeof fileMock.content === 'object' ? JSON.stringify(fileMock.content, null, 2) : fileMock.content;
    fs.writeFileSync(filePath, content ?? '');
  }

  reset() {
    this.clear();
  }

  clear() {
    fs.rmSync(this._rootDir, { recursive: true, force: true });
    fs.mkdirSync(this._rootDir);
  }

  #createDirIfNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

export class FileSystemRead {
  #fileSystemClient: FileSystem;

  constructor(fileSystemClient: FileSystem) {
    this.#fileSystemClient = fileSystemClient;
  }

  readAppFile(relativePath: string): string {
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

  readAppFileAsObject(relativePath: string): any {
    const str = this.readAppFile(relativePath);
    try {
      return JSON.parse(str);
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      throw new Error(`Failed to parse JSON file "${file}": ${e.message}`);
    }
  }

  readIdsCacheFile() {
    const file = this.#fileSystemClient.getIdsCacheFile();
    if (file == null) {
      throw new Error('ids cache file does not exist yet — seed it with withIdsCacheFile');
    }
    const str = fs.readFileSync(file, 'utf-8');
    try {
      return JSON.parse(str);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON file "${file}": ${e.message}`);
    }
  }
}
