import assert from 'node:assert/strict';
import { type ContentExpectation, toComparable } from '../common/content-expectation.ts';
import type { RunCliResult } from './run-cli.ts';

/**
 * The part of `RunCliResult` the assertions read. `timedOut`, `terminal` and `output` are optional: an absent
 * `timedOut` counts as no timeout, an absent `terminal` as a run with pipes.
 */
export type AssertableCliResult = Pick<RunCliResult, 'exitCode' | 'stdout' | 'stderr'> &
  Partial<Pick<RunCliResult, 'timedOut' | 'terminal' | 'output'>>;

type StdoutExpectation =
  | { stdoutText: string; stdoutJson?: never; stdoutMatch?: never }
  | { stdoutText?: never; stdoutJson: unknown; stdoutMatch?: never }
  | { stdoutText?: never; stdoutJson?: never; stdoutMatch: RegExp }
  | { stdoutText?: never; stdoutJson?: never; stdoutMatch?: never };

type StderrExpectation =
  | { stderrText: string; stderrJson?: never; stderrMatch?: never }
  | { stderrText?: never; stderrJson: unknown; stderrMatch?: never }
  | { stderrText?: never; stderrJson?: never; stderrMatch: RegExp }
  | { stderrText?: never; stderrJson?: never; stderrMatch?: never };

/** A run with pipes: stdout and stderr are checked apart. */
type PipesExpectation = StdoutExpectation & StderrExpectation & { outputText?: never };

/** A run in a terminal (a key was sent): its single output, the screen it leaves, is checked as a whole. */
type TerminalExpectation = {
  outputText: string;
  stdoutText?: never;
  stdoutJson?: never;
  stdoutMatch?: never;
  stderrText?: never;
  stderrJson?: never;
  stderrMatch?: never;
};

/**
 * Expected result of a CLI run. With pipes, each output takes the forms of `ContentExpectation` (`*Text`, `*Json`,
 * `*Match`), and an omitted output (no `stdout*` or no `stderr*` key) must be empty. In a terminal, `outputText` is
 * the screen the command leaves.
 */
export type CliResultExpectation = { exitCode: number } & (PipesExpectation | TerminalExpectation);

/**
 * Assert the exit code, then stderr, then stdout of a CLI run, each with its own message.
 * An unexpected exit code shows both outputs, since they usually explain it. stderr comes before stdout because it
 * often explains a wrong stdout. Texts are compared line by line for a readable diff.
 * @param result - Result of `runCli()`
 * @param expected - `exitCode`, plus at most one of `stdoutText`, `stdoutJson`, `stdoutMatch` and one of `stderrText`,
 *   `stderrJson`, `stderrMatch`. An omitted output must be empty. For a run in a terminal, `outputText` only
 */
export function assertCliResult(result: AssertableCliResult, expected: CliResultExpectation): void {
  assertExitCode(result, expected.exitCode);
  const { outputText } = expected;
  if (outputText != null) {
    assert.ok(
      result.terminal === true,
      'outputText is for a run in a terminal (a key sent in interactions), assert stdout and stderr instead',
    );
    const comparable = toComparable(result.output ?? '', { text: outputText });
    assert.deepEqual(comparable.actual, comparable.expected, 'output does not match outputText');
    return;
  }
  assert.ok(
    result.terminal !== true,
    'this run used a terminal (a key was sent in interactions): stdout and stderr are merged, assert outputText',
  );
  assertOutput('stderr', result.stderr, expected);
  assertOutput('stdout', result.stdout, expected);
}

/**
 * Assert the exit code of a CLI run. A timeout always fails, since `runCli()` reports it as an exit code 1.
 * On failure, the message shows both outputs, since they usually explain it.
 * @param result - Result of `runCli()`
 * @param exitCode - Expected exit code
 */
export function assertExitCode(result: AssertableCliResult, exitCode: number): void {
  assert.notEqual(
    result.timedOut,
    true,
    ['command timed out and was killed', `stderr:\n${indent(result.stderr)}`, `stdout:\n${indent(result.stdout)}`].join(
      '\n',
    ),
  );
  assert.equal(
    result.exitCode,
    exitCode,
    [
      `exit code: expected ${exitCode}, got ${result.exitCode}`,
      `stderr:\n${indent(result.stderr)}`,
      `stdout:\n${indent(result.stdout)}`,
    ].join('\n'),
  );
}

/** Compare one output with its `*Text`, `*Json` or `*Match` expectation, or with an empty text if none is given. */
function assertOutput(name: 'stdout' | 'stderr', actual: string, expected: CliResultExpectation): void {
  const record = expected as Record<string, unknown>;
  const forms = { Text: 'text', Json: 'json', Match: 'match' } as const;
  for (const [suffix, form] of Object.entries(forms)) {
    const key = `${name}${suffix}`;
    if (key in record) {
      const comparable = toComparable(actual, { [form]: record[key] } as ContentExpectation);
      assert.deepEqual(comparable.actual, comparable.expected, `${name} does not match ${key}`);
      return;
    }
  }
  const comparable = toComparable(actual, { text: '' });
  assert.deepEqual(
    comparable.actual,
    comparable.expected,
    `${name} is not empty, while no ${name}Text, ${name}Json or ${name}Match is given`,
  );
}

function indent(output: string): string {
  if (output === '') {
    return '  (empty)';
  }
  return output
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}
