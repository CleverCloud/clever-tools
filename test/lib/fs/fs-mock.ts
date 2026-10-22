import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Real files in a temporary directory. Paths are relative to it. Nothing exists on disk until `reset()`. */
export class FsMock {
  #rootDir: string | undefined;
  // `undefined` means the default, the temporary directory itself.
  #cwd: string | undefined;

  /** Write a file, creating its parent directories. An object is written as indented JSON. */
  write(filePath: string, content: string | object): void {
    const file = this.#resolve(filePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }

  /** Read a file as UTF-8. */
  read(filePath: string): string {
    return fs.readFileSync(this.#resolve(filePath), 'utf8');
  }

  /**
   * Absolute path of a file, e.g. for `assertFile()` or to interpolate in an expected output.
   * Without `filePath`, the temporary directory itself. Only known once reset.
   */
  getPath(filePath = ''): string {
    return this.#resolve(filePath);
  }

  /**
   * Working directory of the program under test, created if missing. Without `dirPath`, the temporary directory
   * itself, which is the default, back to it on reset.
   */
  setCwd(dirPath = ''): void {
    const dir = this.#resolve(dirPath);
    fs.mkdirSync(dir, { recursive: true });
    this.#cwd = dir;
  }

  /** Replace the temporary directory by a new empty one, and the cwd by the default. */
  reset(): void {
    this.stop();
    this.#rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-mock-'));
  }

  /** Remove the temporary directory. */
  stop(): void {
    if (this.#rootDir != null) {
      fs.rmSync(this.#rootDir, { recursive: true, force: true });
    }
    this.#rootDir = undefined;
    this.#cwd = undefined;
  }

  /** Absolute path of the working directory set by `setCwd()`, the temporary directory by default. */
  getCwd(): string {
    return this.#cwd ?? this.getPath();
  }

  #resolve(filePath: string): string {
    if (this.#rootDir == null) {
      throw new Error('The file system mock is not reset');
    }
    if (path.isAbsolute(filePath)) {
      throw new Error(`path must be relative, got "${filePath}"`);
    }
    const resolved = path.resolve(this.#rootDir, filePath);
    if (resolved !== this.#rootDir && !resolved.startsWith(this.#rootDir + path.sep)) {
      throw new Error(`path must not escape the mock directory, got "${filePath}"`);
    }
    return resolved;
  }
}
