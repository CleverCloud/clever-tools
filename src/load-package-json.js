import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pkg;

export function getPackageJson () {
  if (pkg == null) {
    const pkgJson = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
    pkg = JSON.parse(pkgJson);
  }
  return pkg;
}
