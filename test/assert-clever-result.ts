import assert from 'node:assert/strict';
import {
  type AssertableCliResult,
  assertCliResult,
  assertExitCode,
  type CliResultExpectation,
} from './lib/cli/assert-cli-result.ts';
import { toComparable } from './lib/common/content-expectation.ts';

/**
 * A usage error of the CLI: the error lines (e.g. `email: missing value`), a blank line, then the help of the command,
 * all on stdout, with an empty stderr. Only the error lines are compared, the help must just be there.
 */
export type UsageErrorExpectation = { exitCode: number; usageError: string };

export type CleverResultExpectation = CliResultExpectation | UsageErrorExpectation;

/**
 * Assert the result of a `clever` run: `assertCliResult()`, plus the `usageError` form for the argument and option
 * errors, printed before the help of the command.
 * @param result - Result of `runClever()`
 * @param expected - Either an expectation of `assertCliResult()`, or `exitCode` and `usageError` (the expected error
 *   lines, without the help that follows them)
 */
export function assertCleverResult(result: AssertableCliResult, expected: CleverResultExpectation): void {
  if (!('usageError' in expected)) {
    assertCliResult(result, expected);
    return;
  }
  assertExitCode(result, expected.exitCode);
  const stderr = toComparable(result.stderr, { text: '' });
  assert.deepEqual(stderr.actual, stderr.expected, 'stderr is not empty, while a usageError is expected');
  const separator = result.stdout.indexOf('\n\n');
  const errorLines = separator === -1 ? result.stdout : result.stdout.slice(0, separator);
  const usageError = toComparable(errorLines, { text: expected.usageError });
  assert.deepEqual(usageError.actual, usageError.expected, 'the error lines before the help do not match usageError');
  assert.ok(
    separator !== -1 && result.stdout.slice(separator + 2).trim() !== '',
    `the usage error is not followed by the help of the command, stdout:\n${result.stdout}`,
  );
}
