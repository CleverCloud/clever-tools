import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toComparable } from '../common/content-expectation.ts';

/**
 * Assert the text of a file, trimmed, equal to the expected text once dedented, with a line by line diff.
 * A missing file fails with a diff instead of an `ENOENT` error.
 * @param filePath - Absolute path, e.g. from `fsMock.getPath()`
 * @param expected - Expected text, dedented (common indentation, leading and trailing blank lines removed)
 */
export function assertFile(filePath: string, expected: string): void {
  assertFileContent(filePath, { text: expected });
}

/**
 * Assert the content of a file, parsed as JSON, deeply equal to `expected` (key order and formatting ignored).
 * A missing file fails with a diff instead of an `ENOENT` error, a file that is not JSON shows its lines in the diff.
 * @param filePath - Absolute path, e.g. from `fsMock.getPath()`
 * @param expected - Expected value
 */
export function assertJsonFile(filePath: string, expected: unknown): void {
  assertFileContent(filePath, { json: expected });
}

/**
 * Assert that a file does not exist, e.g. that a failed command wrote nothing.
 * @param filePath - Absolute path, e.g. from `fsMock.getPath()`
 */
export function assertNoFile(filePath: string): void {
  assert.equal(fs.existsSync(filePath), false, `${filePath} should not exist`);
}

function assertFileContent(filePath: string, expected: { text: string } | { json: unknown }): void {
  if (!fs.existsSync(filePath)) {
    assert.deepEqual({ path: filePath, missing: true }, { path: filePath, content: expected });
    return;
  }
  // Trimmed like the outputs of `runCli()`: `dedent` trims the expected text, so a final newline could never match.
  const content = toComparable(fs.readFileSync(filePath, 'utf8').trim(), expected);
  assert.deepEqual({ path: filePath, content: content.actual }, { path: filePath, content: content.expected });
}
