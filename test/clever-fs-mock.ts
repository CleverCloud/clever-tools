import path from 'node:path';
import { FsMock } from './lib/fs/fs-mock.ts';

/** User config file of the CLI (`CONFIGURATION_FILE`), with its profiles. */
export interface ConfigFile {
  version: 1;
  profiles: Array<ConfigFileProfile>;
}

export interface ConfigFileProfile {
  alias: string;
  token: string;
  secret: string;
  expirationDate?: string;
  userId?: string;
  email?: string;
  overrides?: Partial<
    Record<
      'API_HOST' | 'CONSOLE_URL' | 'AUTH_BRIDGE_HOST' | 'SSH_GATEWAY' | 'OAUTH_CONSUMER_KEY' | 'OAUTH_CONSUMER_SECRET',
      string
    >
  >;
}

/** Experimental features file of the CLI (`EXPERIMENTAL_FEATURES_FILE`), as written by `clever features enable`. */
export type ExperimentalFeaturesFile = Partial<Record<'system-git' | 'k8s' | 'ng' | 'operators', boolean>>;

/** `.clever.json` of an application directory, with the linked applications. */
export interface AppConfigFile {
  apps: Array<AppConfigFileApp>;
  /** `app_id` of the default application. */
  default?: string;
}

export interface AppConfigFileApp {
  app_id: string;
  org_id: string;
  deploy_url: string;
  git_ssh_url?: string;
  name: string;
  /** Always written by the CLI, but a `.clever.json` edited by hand can omit it. */
  alias?: string;
}

/**
 * Where the CLI finds its files in the sandbox. By convention, config files go in `config/`, apps in `<app>/`.
 * `appConfig` is a file name, in the directory of an app.
 */
export const CLEVER_FILES = {
  config: 'config/clever-tools.json',
  experimentalFeatures: 'config/clever-tools-experimental-features.json',
  idsCache: 'config/ids-cache.json',
  appConfig: '.clever.json',
} as const;

/** `FsMock`, plus typed helpers for the files of the CLI. */
export class CleverFsMock extends FsMock {
  /**
   * Write the config file. A string is written as is, an object as indented JSON.
   * `string` and `object` let a test write an invalid file (broken JSON, missing key): they also accept any object, so
   * a typo in a valid file is not caught at compile time.
   */
  writeConfigFile(content: ConfigFile | string | object): void {
    this.write(CLEVER_FILES.config, content);
  }

  readConfigFile(): ConfigFile {
    return JSON.parse(this.read(CLEVER_FILES.config)) as ConfigFile;
  }

  /** Absolute path of the config file, e.g. for `assertJsonFile()`. */
  configFilePath(): string {
    return this.getPath(CLEVER_FILES.config);
  }

  /**
   * Write the experimental features file. A string is written as is, an object as indented JSON.
   * `string` and `object` let a test write an invalid file (unknown key, non boolean value, broken JSON): they also
   * accept any object, so a typo in a valid file is not caught at compile time.
   */
  writeExperimentalFeaturesFile(content: ExperimentalFeaturesFile | string | object): void {
    this.write(CLEVER_FILES.experimentalFeatures, content);
  }

  /** Absolute path of the experimental features file, e.g. for `assertJsonFile()`. */
  experimentalFeaturesFilePath(): string {
    return this.getPath(CLEVER_FILES.experimentalFeatures);
  }

  /**
   * Write the `.clever.json` of the app in `appDir`, e.g. `myapp`. A string is written as is, an object as indented
   * JSON. `string` and `object` let a test write an invalid file (broken JSON, missing key): they also accept any
   * object, so a typo in a valid file is not caught at compile time.
   */
  writeAppConfigFile(appDir: string, content: AppConfigFile | string | object): void {
    this.write(path.join(appDir, CLEVER_FILES.appConfig), content);
  }

  readAppConfigFile(appDir: string): AppConfigFile {
    return JSON.parse(this.read(path.join(appDir, CLEVER_FILES.appConfig))) as AppConfigFile;
  }

  /** Absolute path of the `.clever.json` of the app in `appDir`, e.g. for `assertJsonFile()`. */
  appConfigFilePath(appDir: string): string {
    return this.getPath(path.join(appDir, CLEVER_FILES.appConfig));
  }
}
