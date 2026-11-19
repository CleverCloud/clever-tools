import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderTerminalScreen } from './terminal-screen.ts';

describe('renderTerminalScreen', () => {
  it('with a line erased and redrawn, should keep its last version', async () => {
    const raw = '? Name:\x1B[2K\x1B[G? Name: a\x1B[2K\x1B[G? Name: ab\x1B[2K\x1B[G✔ Name: ab\nDone';

    assert.equal(await renderTerminalScreen(raw), '✔ Name: ab\nDone');
  });

  it('with a cursor moved back on the line, should overwrite the text there', async () => {
    assert.equal(await renderTerminalScreen('abcdef\x1B[3Gxy'), 'abxyef');
  });

  it('should render a piped `\\n` like the `\\r\\n` of a terminal', async () => {
    assert.equal(await renderTerminalScreen('first\nsecond'), 'first\nsecond');
    assert.equal(await renderTerminalScreen('first\r\nsecond'), 'first\nsecond');
  });

  it('should drop the trailing spaces and the trailing empty lines', async () => {
    assert.equal(await renderTerminalScreen('first   \n\n  second  \n\n\n'), 'first\n\n  second');
  });

  it('with a line longer than the screen of a terminal, should not wrap it', async () => {
    const line = 'x'.repeat(300);

    assert.equal(await renderTerminalScreen(line), line);
  });

  it('with colors, should drop them', async () => {
    assert.equal(await renderTerminalScreen('\x1B[32mgreen\x1B[39m'), 'green');
  });
});
