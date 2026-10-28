import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatBorderedTable } from './format-table.js';

describe('formatBorderedTable', () => {
  it('returns an empty string without rows', () => {
    assert.strictEqual(formatBorderedTable([]), '');
  });

  it('draws a header, a separator and the rows, without index column nor quotes', () => {
    const table = formatBorderedTable([
      ['ID', 'NAME'],
      ['a', 'first'],
      ['bb', 'second'],
    ]);
    assert.strictEqual(
      table,
      [
        '┌────┬────────┐',
        '│ ID │ NAME   │',
        '├────┼────────┤',
        '│ a  │ first  │',
        '│ bb │ second │',
        '└────┴────────┘',
      ].join('\n'),
    );
  });

  it('prints nullish cells and missing cells as empty', () => {
    const table = formatBorderedTable([['A', 'B'], [null, undefined], ['x']]);
    assert.strictEqual(
      table,
      ['┌───┬───┐', '│ A │ B │', '├───┼───┤', '│   │   │', '│ x │   │', '└───┴───┘'].join('\n'),
    );
  });

  it('widens columns to the given minimum widths', () => {
    const table = formatBorderedTable([['A'], ['b']], [3]);
    assert.strictEqual(table, ['┌─────┐', '│ A   │', '├─────┤', '│ b   │', '└─────┘'].join('\n'));
  });

  it('ignores ANSI escape codes when measuring cells', () => {
    const table = formatBorderedTable([['A'], ['\u001b[31mred\u001b[39m']]);
    assert.strictEqual(table.split('\n')[1], '│ A   │');
  });
});
