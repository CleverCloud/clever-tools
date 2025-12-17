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

// Wrap parser functions to allow them to simply return values or throw errors
// instead of using cliparse.parsers.success/error
function wrapParser(parser) {
  return (value) => {
    try {
      return cliparseOriginal.parsers.success(parser(value));
    } catch (error) {
      return cliparseOriginal.parsers.error(error.message);
    }
  };
}

// Patch cliparse.option to wrap parser functions
const cliparseOption = cliparseOriginal.option;
cliparseOriginal.option = function (name, options) {
  if (options?.parser != null) {
    options.parser = wrapParser(options.parser);
  }
  return cliparseOption(name, options);
};

// Patch cliparse.argument to wrap parser functions
const cliparseArgument = cliparseOriginal.argument;
cliparseOriginal.argument = function (name, options) {
  if (options?.parser != null) {
    options.parser = wrapParser(options.parser);
  }
  return cliparseArgument(name, options);
};

export const cliparse = cliparseOriginal;
