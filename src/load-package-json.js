import fs from 'fs';
import path from 'path';

let pkg;

export function getPackageJson () {
  if (pkg == null) {
    const pkgJson = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
    pkg = JSON.parse(pkgJson);
  }
  return pkg;
}
