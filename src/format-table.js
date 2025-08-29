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
      return row
        .map((cell, index) => {
          const isLastColumn = index === row.length - 1;
          if (isLastColumn) {
            return cell;
          }
          const rightPaddingLength = columnSizes[index] - stringLength(cell) ?? 0;
          return cell + ' '.repeat(rightPaddingLength);
        })
        .join(SEPARATOR);
    })
    .join('\n');
};
