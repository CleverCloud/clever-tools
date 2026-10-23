import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertCliResult } from './assert-cli-result.ts';

describe('assertCliResult', () => {
  describe('text', () => {
    it('should compare with the dedented expected text', () => {
      assertCliResult(
        { exitCode: 0, stdout: 'title\n • item', stderr: 'warning' },
        {
          exitCode: 0,
          stdoutText: `
            title
             • item
          `,
          stderrText: 'warning',
        },
      );
    });

    it('with different texts, should fail', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'title', stderr: '' }, { exitCode: 0, stdoutText: 'other' }),
        assert.AssertionError,
      );
    });
  });

  describe('exit code', () => {
    it('with a different exit code, should fail and show both outputs', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 1, stdout: 'partial', stderr: '[ERROR] boom' }, { exitCode: 0 }),
        (error: Error) =>
          error instanceof assert.AssertionError &&
          error.message.startsWith('exit code: expected 0, got 1') &&
          error.message.includes('[ERROR] boom') &&
          error.message.includes('partial'),
      );
    });

    it('should check the exit code before the outputs', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 1, stdout: 'other', stderr: 'other' }, { exitCode: 0 }),
        (error: Error) => error instanceof assert.AssertionError && error.message.startsWith('exit code:'),
      );
    });
  });

  describe('order and messages', () => {
    it('should check stderr before stdout', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'other', stderr: 'other' }, { exitCode: 0 }),
        (error: Error) => error instanceof assert.AssertionError && error.message.startsWith('stderr is not empty'),
      );
    });

    it('should name the expectation that failed', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'other', stderr: '' }, { exitCode: 0, stdoutJson: {} }),
        (error: Error) =>
          error instanceof assert.AssertionError && error.message.startsWith('stdout does not match stdoutJson'),
      );
    });

    it('should name stdout in its message', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'other', stderr: '' }, { exitCode: 0 }),
        (error: Error) => error instanceof assert.AssertionError && error.message.startsWith('stdout is not empty'),
      );
    });
  });

  describe('omitted outputs', () => {
    it('with both outputs empty, should pass', () => {
      assertCliResult({ exitCode: 0, stdout: '', stderr: '' }, { exitCode: 0 });
    });

    it('with an omitted stdout that is not empty, should fail', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'unexpected', stderr: '' }, { exitCode: 0 }),
        assert.AssertionError,
      );
    });

    it('with an omitted stderr that is not empty, should fail', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'out', stderr: 'warning' }, { exitCode: 0, stdoutText: 'out' }),
        assert.AssertionError,
      );
    });
  });

  describe('json', () => {
    it('should ignore formatting and key order', () => {
      assertCliResult(
        { exitCode: 0, stdout: '{"b":2,\n  "a":[1]}', stderr: '' },
        { exitCode: 0, stdoutJson: { a: [1], b: 2 } },
      );
    });

    it('with different values, should fail', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: '{"a":1}', stderr: '' }, { exitCode: 0, stdoutJson: { a: 2 } }),
        assert.AssertionError,
      );
    });

    it('with a text that is not valid JSON, should fail with the raw text in the diff', () => {
      assert.throws(
        () => assertCliResult({ exitCode: 0, stdout: 'not json', stderr: '' }, { exitCode: 0, stdoutJson: {} }),
        (error: Error) => error instanceof assert.AssertionError && error.message.includes('not json'),
      );
    });
  });

  describe('match', () => {
    it('with a matching regex, should pass', () => {
      assertCliResult(
        { exitCode: 0, stdout: 'Done in 42s', stderr: '' },
        { exitCode: 0, stdoutMatch: /^Done in \d+s$/ },
      );
    });

    it('should ignore the state of a global regex', () => {
      const regex = /Done/g;
      const result = { exitCode: 0, stdout: 'Done', stderr: '' };

      assertCliResult(result, { exitCode: 0, stdoutMatch: regex });
      assertCliResult(result, { exitCode: 0, stdoutMatch: regex });
    });

    it('with a regex that does not match, should fail', () => {
      assert.throws(
        () =>
          assertCliResult(
            { exitCode: 0, stdout: 'Done in 1m', stderr: '' },
            { exitCode: 0, stdoutMatch: /^Done in \d+s$/ },
          ),
        assert.AssertionError,
      );
    });
  });
});
