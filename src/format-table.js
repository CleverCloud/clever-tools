import charRegex from 'char-regex';
import { stripVTControlCharacters } from 'node:util';

const SEPARATOR = '  ';

function stringLength(string) {
  if (!string) {
    return 0;
  }
  const stringWithoutAnsi = stripVTControlCharacters(string);
  if (!stringWithoutAnsi) {
    return 0;
  }
  const stringWithSplitEmojis = stringWithoutAnsi.match(charRegex());
  if (!stringWithSplitEmojis) {
    return 0;
  }
  return stringWithSplitEmojis.length;
}

export const formatTable = (data, columnWidth = []) => {
  const fixedWidthPlaceholder = columnWidth.map((item) => {
    return typeof item === 'number' ? ' '.repeat(item) : item;
  });

  const columnSizes = [fixedWidthPlaceholder, ...data]
    .map((row) => row.map((cell) => String(cell)))
    .reduce((acc, row) => {
      row.forEach((cell, index) => {
        const cellLength = stringLength(cell);
        acc[index] = Math.max(acc[index] ?? 0, cellLength);
      });
      return acc;
    }, []);

  return data
    .map((row) => row.map((cell) => String(cell)))
    .map((row) => {
      return (
        row
          .map((cell, index) => {
            const isLastColumn = index === row.length - 1;
            if (isLastColumn) {
              return cell;
            }
            const rightPaddingLength = columnSizes[index] - stringLength(cell);
            return cell + ' '.repeat(rightPaddingLength);
          })
          .join(SEPARATOR)
          // empty trailing cells would otherwise pad the line with meaningless spaces
          .trimEnd()
      );
    })
    .join('\n');
};

/**
 * Format rows as a table with borders, like `console.table()` but without its index column nor quotes around strings.
 * The first row is the header.
 * @param {Array<Array<unknown>>} data
 * @param {Array<number>} [columnWidth=[]] - Minimum width of each column, to align several tables
 * @returns {string}
 */
export function formatBorderedTable(data, columnWidth = []) {
  // Same as `formatTable()`: no rows, no table
  if (data.length === 0) {
    return '';
  }

  const [headers, ...rows] = data.map((row) => row.map((cell) => String(cell ?? '')));

  const columnSizes = [...columnWidth];
  for (const row of [headers, ...rows]) {
    for (const [index, cell] of row.entries()) {
      columnSizes[index] = Math.max(columnSizes[index] ?? 0, stringLength(cell));
    }
  }

  function formatBorder(left, middle, right) {
    return left + columnSizes.map((size) => '─'.repeat(size + 2)).join(middle) + right;
  }

  function formatRow(row) {
    const cells = columnSizes.map((size, index) => {
      const cell = row[index] ?? '';
      return ` ${cell}${' '.repeat(size - stringLength(cell))} `;
    });
    return `│${cells.join('│')}│`;
  }

  return [
    formatBorder('┌', '┬', '┐'),
    formatRow(headers),
    formatBorder('├', '┼', '┤'),
    ...rows.map(formatRow),
    formatBorder('└', '┴', '┘'),
  ].join('\n');
}
