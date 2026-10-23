import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertCleverResult } from './assert-clever-result.ts';

const HELP = 'Add a new secondary email address\n\nUSAGE\n  clever emails add <email>';

describe('assertCleverResult', () => {
  it('should compare the error lines only, not the help', () => {
    assertCleverResult(
      { exitCode: 1, stdout: `email: missing value\nUnknown option: nope\n\n${HELP}`, stderr: '' },
      { exitCode: 1, usageError: 'email: missing value\nUnknown option: nope' },
    );
  });

  it('with different error lines, should fail', () => {
    assert.throws(
      () =>
        assertCleverResult(
          { exitCode: 1, stdout: `email: Invalid email address\n\n${HELP}`, stderr: '' },
          { exitCode: 1, usageError: 'email: missing value' },
        ),
      (error: Error) =>
        error instanceof assert.AssertionError &&
        error.message.startsWith('the error lines before the help do not match usageError'),
    );
  });

  it('with no help after the error lines, should fail', () => {
    assert.throws(
      () =>
        assertCleverResult(
          { exitCode: 1, stdout: 'email: missing value', stderr: '' },
          { exitCode: 1, usageError: 'email: missing value' },
        ),
      (error: Error) =>
        error instanceof assert.AssertionError && error.message.startsWith('the usage error is not followed'),
    );
  });

  it('with a stderr that is not empty, should fail', () => {
    assert.throws(
      () =>
        assertCleverResult(
          { exitCode: 1, stdout: `email: missing value\n\n${HELP}`, stderr: '[WARN] x' },
          { exitCode: 1, usageError: 'email: missing value' },
        ),
      (error: Error) => error instanceof assert.AssertionError && error.message.startsWith('stderr is not empty'),
    );
  });

  it('with an unexpected exit code, should fail', () => {
    assert.throws(
      () =>
        assertCleverResult(
          { exitCode: 0, stdout: `email: missing value\n\n${HELP}`, stderr: '' },
          { exitCode: 1, usageError: 'email: missing value' },
        ),
      (error: Error) =>
        error instanceof assert.AssertionError && error.message.startsWith('exit code: expected 1, got 0'),
    );
  });

  it('should delegate any other expectation to assertCliResult', () => {
    assertCleverResult({ exitCode: 0, stdout: 'ok', stderr: '' }, { exitCode: 0, stdoutText: 'ok' });
    assert.throws(
      () => assertCleverResult({ exitCode: 0, stdout: 'ok', stderr: '' }, { exitCode: 0, stdoutText: 'ko' }),
      assert.AssertionError,
    );
  });
});
