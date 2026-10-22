import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, beforeEach, describe, it } from 'node:test';
import { FsMock } from './fs-mock.ts';

describe('FsMock', () => {
  const fsMock = new FsMock();

  beforeEach(() => fsMock.reset());
  after(() => fsMock.stop());

  describe('write and read', () => {
    it('should write and read a text file', () => {
      fsMock.write('notes.txt', 'hello');

      assert.equal(fsMock.read('notes.txt'), 'hello');
    });

    it('should write an object as indented JSON', () => {
      fsMock.write('config.json', { a: [1] });

      assert.equal(fsMock.read('config.json'), '{\n  "a": [\n    1\n  ]\n}');
    });

    it('should create the parent directories', () => {
      fsMock.write('config/clever-cloud/clever-tools.json', '{}');

      assert.equal(fsMock.read('config/clever-cloud/clever-tools.json'), '{}');
    });
  });

  describe('getPath', () => {
    it('should return an absolute path inside the temporary directory', () => {
      const file = fsMock.getPath('sub/file.txt');

      assert.ok(path.isAbsolute(file));
      assert.equal(path.dirname(path.dirname(file)), fsMock.getPath());
    });

    it('without a file path, should return an existing directory', () => {
      assert.ok(fs.statSync(fsMock.getPath()).isDirectory());
    });

    it('should reject an absolute path', () => {
      assert.throws(() => fsMock.getPath('/etc/passwd'), /path must be relative/);
      assert.throws(() => fsMock.write('/tmp/x', 'x'), /path must be relative/);
    });

    it('should reject a path escaping the temporary directory', () => {
      assert.throws(() => fsMock.getPath('../x'), /path must not escape the mock directory/);
      assert.throws(() => fsMock.read('a/../..'), /path must not escape the mock directory/);
    });
  });

  describe('setCwd', () => {
    it('should default to the temporary directory', () => {
      assert.equal(fsMock.getCwd(), fsMock.getPath());
    });

    it('should set a subdirectory as cwd, creating it', () => {
      fsMock.setCwd('myapp/src');

      assert.equal(fsMock.getCwd(), fsMock.getPath('myapp/src'));
      assert.ok(fs.statSync(fsMock.getCwd()).isDirectory());
    });

    it('should reject a path escaping the temporary directory', () => {
      assert.throws(() => fsMock.setCwd('..'), /path must not escape the mock directory/);
    });

    it('should go back to the default on reset', () => {
      fsMock.setCwd('myapp');

      fsMock.reset();

      assert.equal(fsMock.getCwd(), fsMock.getPath());
    });
  });

  describe('reset', () => {
    it('should replace the temporary directory by a new empty one and remove the previous one', () => {
      fsMock.write('a.txt', 'a');
      const previousDir = fsMock.getPath();

      fsMock.reset();

      assert.notEqual(fsMock.getPath(), previousDir);
      assert.deepEqual(fs.readdirSync(fsMock.getPath()), []);
      assert.equal(fs.existsSync(previousDir), false);
    });
  });
});

describe('FsMock lifecycle', () => {
  it('before the first reset, should throw a clear error', () => {
    const fsMock = new FsMock();

    assert.throws(() => fsMock.getPath(), /The file system mock is not reset/);
    assert.throws(() => fsMock.write('a.txt', 'a'), /The file system mock is not reset/);
  });

  it('should remove the temporary directory on stop', () => {
    const fsMock = new FsMock();
    fsMock.reset();
    const dir = fsMock.getPath();

    fsMock.stop();

    assert.equal(fs.existsSync(dir), false);
  });
});
