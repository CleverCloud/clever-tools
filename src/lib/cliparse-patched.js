import cliparseOriginal from 'cliparse';
import semver from 'semver';
import pkg from '../../package.json' with { type: 'json' };
import { Logger } from '../logger.js';

// Patch cliparse.command so we can catch errors
const cliparseCommand = cliparseOriginal.command;
cliparseOriginal.command = function (name, options, commandFunction) {
  if (commandFunction == null) {
    return cliparseCommand(name, options);
  }

  return cliparseCommand(name, options, (params) => {
    const promise = commandFunction(params);
    promise.catch((error) => {
      Logger.error(error);
      const semverIsOk = semver.satisfies(process.version, pkg.engines.node);
      if (!semverIsOk) {
        Logger.warn(
          `You are using node ${process.version}, some of our commands require node ${pkg.engines.node}. The error may be caused by this.`,
        );
      }
      process.exit(1);
    });
  });
};

export const cliparse = cliparseOriginal;
