import _ from 'lodash';
import stringLength from 'string-length';
import table from 'text-table';

export function formatTable(columnWidth = []) {
  const fixedWidthPlaceholder = columnWidth.map((item) => {
    if (typeof item === 'number') {
      return _.repeat(' ', item);
    }
    return item;
  });

  return function (data) {
    return table([fixedWidthPlaceholder, ...data], { stringLength })
      .split('\n')
      .slice(1)
      .join('\n');
  };
}
