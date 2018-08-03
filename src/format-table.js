'use strict';

const _ = require('lodash');
const table = require('text-table');
const stringLength = require('string-length');

function formatTable (columnWidth = []) {

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

module.exports = formatTable;
