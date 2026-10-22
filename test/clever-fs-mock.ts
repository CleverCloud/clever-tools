import { FsMock } from './lib/fs/fs-mock.ts';

/** Experimental features file of the CLI (`EXPERIMENTAL_FEATURES_FILE`), as written by `clever features enable`. */
export type ExperimentalFeaturesFile = Partial<Record<'system-git' | 'k8s' | 'ng' | 'operators', boolean>>;

/** Where the CLI finds its files in the sandbox. By convention, config files go in `config/`, apps in `<app>/`. */
export const CLEVER_FILES = {
  config: 'config/clever-tools.json',
  experimentalFeatures: 'config/clever-tools-experimental-features.json',
  idsCache: 'config/ids-cache.json',
} as const;

/** `FsMock`, plus typed helpers for the files of the CLI. */
export class CleverFsMock extends FsMock {
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
}
