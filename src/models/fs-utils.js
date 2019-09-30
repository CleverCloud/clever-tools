'use strict';

const { join } = require('path');
const fs = require('fs');
const { promisify } = require('util');

const fsStat = promisify(fs.stat);

function findPath (dir, name) {
  const fullPath = join(dir, name);
  return fsStat(fullPath)
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
