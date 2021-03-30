'use strict';

const { join } = require('path');
const { promises: fs } = require('fs');

function findPath (dir, name) {
  const fullPath = join(dir, name);
  return fs.stat(fullPath)
    .then(() => dir)
    .catch((e) => {
      if (e.code === 'ENOENT' && dir !== '/') {
        const parent = join(dir, '..');
        return findPath(parent, name);
      }
      throw e;
    });
}

module.exports = { findPath };
