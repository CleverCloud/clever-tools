import { Logger } from './logger.js';
import pkg from '../package.json' with { type: 'json' };
import semver from 'semver';

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
