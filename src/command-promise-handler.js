import { Logger } from './logger.js';
import { getPackageJson } from './load-package-json.js';
import semver from 'semver';

const pkg = getPackageJson();

export function handleCommandPromise (promise) {
  promise.catch((error) => {
    Logger.error(error);
    const semverIsOk = semver.satisfies(process.version, pkg.engines.node);
    if (!semverIsOk) {
      Logger.warn(`You are using node ${process.version}, some of our commands require node ${pkg.engines.node}. The error may be caused by this.`);
    }
    process.exit(1);
  });
}
