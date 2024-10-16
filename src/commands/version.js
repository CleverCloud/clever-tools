import { Logger } from '../logger.js';
import { getPackageJson } from '../load-package-json.cjs';

const pkg = getPackageJson();

export async function version () {
  Logger.println(pkg.version);
}
