import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { assertFile, assertJsonFile, assertNoFile } from './assert-file.ts';

describe('assertFile', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-assertions-'));

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('should compare the text of a file, dedented', () => {
    const file = path.join(dir, 'notes.txt');
    fs.writeFileSync(file, 'first\nsecond');

    assertFile(
      file,
      `
        first
        second
      `,
    );
    assert.throws(() => assertFile(file, 'first'), assert.AssertionError);
  });

  it('with a final newline in the file, should ignore it', () => {
    const file = path.join(dir, 'gitignore.txt');
    fs.writeFileSync(file, 'node_modules\n');

    assertFile(file, 'node_modules');
  });

  it('with a missing file, should fail with a diff', () => {
    assert.throws(() => assertFile(path.join(dir, 'missing.txt'), ''), assert.AssertionError);
  });
});

describe('assertJsonFile', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-assertions-'));

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('should compare the parsed JSON, formatting ignored', () => {
    const file = path.join(dir, 'config.json');
    fs.writeFileSync(file, '{ "a": 1, "b": [2] }');

    assertJsonFile(file, { b: [2], a: 1 });
    assert.throws(() => assertJsonFile(file, { a: 1 }), assert.AssertionError);
  });

  it('with a file that is not JSON, should fail', () => {
    const file = path.join(dir, 'broken.json');
    fs.writeFileSync(file, '[WARN] not JSON');

    assert.throws(() => assertJsonFile(file, {}), assert.AssertionError);
  });

  it('with a missing file, should fail with a diff', () => {
    assert.throws(() => assertJsonFile(path.join(dir, 'missing.json'), {}), assert.AssertionError);
  });
});

describe('assertNoFile', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clever-tools-assertions-'));

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('with a missing file, should pass', () => {
    assertNoFile(path.join(dir, 'missing.txt'));
  });

  it('with an existing file, should fail', () => {
    const file = path.join(dir, 'notes.txt');
    fs.writeFileSync(file, 'first');

    assert.throws(() => assertNoFile(file), assert.AssertionError);
  });
});
