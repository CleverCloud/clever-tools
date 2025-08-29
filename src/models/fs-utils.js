import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export function findPath(dir, name) {
  const fullPath = join(dir, name);
  return fs
    .stat(fullPath)
    .then(() => dir)
    .catch((e) => {
      if (e.code === 'ENOENT' && dir !== '/') {
        const parent = join(dir, '..');
        return findPath(parent, name);
      }
      throw e;
    });
}
