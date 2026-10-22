import dedent from 'dedent';

/**
 * What a text is expected to be, in one of three forms:
 * - `text`: equal once dedented (common indentation, leading and trailing blank lines removed)
 * - `json`: parses as JSON deeply equal to the value, key order and formatting ignored
 * - `match`: matches the regex. `^` and `$` anchor the whole text, unless the `m` flag makes them anchor any line
 */
export type ContentExpectation = { text: string } | { json: unknown } | { match: RegExp };

/**
 * Turn a text and its expectation into two values whose deep equality is the assertion.
 * Texts become arrays of lines: `assert` prints a multiline string on a single line with escaped `\n`,
 * while an array of lines gets a line by line diff.
 * @param actual - Text to check
 * @param expectation - What the text is expected to be
 * @returns The values to pass to `assert.deepEqual()`
 */
export function toComparable(actual: string, expectation: ContentExpectation): { actual: unknown; expected: unknown } {
  if ('json' in expectation) {
    // Not JSON: compare the raw lines with the expected value, so the diff shows what was printed instead.
    return { actual: parseJsonOrLines(actual), expected: expectation.json };
  }
  if ('match' in expectation) {
    // `search()` ignores the `g` flag and `lastIndex`, unlike `test()`.
    const matches = actual.search(expectation.match) !== -1;
    return { actual: toLines(actual), expected: matches ? toLines(actual) : expectation.match };
  }
  return { actual: toLines(actual), expected: toLines(dedent(expectation.text)) };
}

function parseJsonOrLines(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return toLines(text);
  }
}

function toLines(text: string): Array<string> {
  return text.split('\n');
}
