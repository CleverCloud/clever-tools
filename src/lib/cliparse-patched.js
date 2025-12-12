import cliparse from 'cliparse';
import cliparseArgumentModule from 'cliparse/src/argument.js';
import cliparseCommands from 'cliparse/src/command.js';
import cliparseOptionModule from 'cliparse/src/option.js';
import semver from 'semver';
import pkg from '../../package.json' with { type: 'json' };
import { Logger } from '../logger.js';
import { styleText } from './style-text.js';

// Patch option.help and option.usage to NOT uppercase metavar
// We want to keep placeholders as defined (lowercase kebab-case)
// Also style the default value in dim/gray
const originalOptionHelp = cliparseOptionModule.help;
cliparseOptionModule.help = function (opt) {
  const result = originalOptionHelp(opt);
  // Replace uppercased metavar with original
  if (opt.metavar) {
    result[0] = result[0].replace(opt.metavar.toUpperCase(), opt.metavar);
  }
  // Style the default value in dim/gray
  // If default is empty string, show "(optional)" instead
  // If default is false (flag), hide it entirely (redundant)
  if (opt.default !== null) {
    if (opt.default === false) {
      result[1] = result[1].replace(' (default: false)', '');
    } else if (opt.default === '') {
      result[1] = result[1].replace('(default: )', styleText('dim', '(optional)'));
    } else {
      result[1] = result[1].replace(`(default: ${opt.default})`, styleText('dim', `(default: ${opt.default})`));
    }
  }
  return result;
};

const originalOptionUsage = cliparseOptionModule.usage;
cliparseOptionModule.usage = function (opt) {
  let result = originalOptionUsage(opt);
  // Replace uppercased metavar with original
  if (opt.metavar) {
    result = result.replace(opt.metavar.toUpperCase(), opt.metavar);
  }
  return result;
};

// Patch argument.usage and argument.help to NOT uppercase argument name
cliparseArgumentModule.usage = function (arg) {
  if (arg.default !== null) {
    return '[' + arg.name + ']';
  } else {
    return '<' + arg.name + '>';
  }
};

const originalArgumentHelp = cliparseArgumentModule.help;
cliparseArgumentModule.help = function (arg) {
  const result = originalArgumentHelp(arg);
  // Replace uppercased name with original
  result[0] = cliparseArgumentModule.usage(arg);
  return result;
};

// Wrap parser functions to allow them to simply return values or throw errors
// instead of using cliparse.parsers.success/error
function wrapParser(parser) {
  return (value) => {
    try {
      return cliparse.parsers.success(parser(value));
    } catch (error) {
      return cliparse.parsers.error(error.message);
    }
  };
}

// Wrap complete functions to allow returning plain arrays
// instead of cliparse.autocomplete.words(array)
function wrapComplete(complete) {
  return (word) => {
    // Support both functions and static arrays (e.g. complete: Drain.DRAIN_TYPE_CLI_CODES)
    const result = typeof complete === 'function' ? complete(word) : complete;
    return Promise.resolve(result).then(cliparse.autocomplete.words);
  };
}

// Patch cliparse.option to wrap parser and complete functions
const cliparseOption = cliparse.option;
cliparse.option = function (name, options) {
  if (options?.parser) {
    options = { ...options, parser: wrapParser(options.parser) };
  }
  if (options?.complete) {
    options = { ...options, complete: wrapComplete(options.complete) };
  }
  return cliparseOption(name, options);
};

// Patch cliparse.argument to wrap parser and complete functions
const cliparseArgument = cliparse.argument;
cliparse.argument = function (name, options) {
  if (options?.parser) {
    options = { ...options, parser: wrapParser(options.parser) };
  }
  if (options?.complete) {
    options = { ...options, complete: wrapComplete(options.complete) };
  }
  return cliparseArgument(name, options);
};

// Patch cliparse.command so we can catch errors and process.exit(1)
const cliparseCommand = cliparse.command;
cliparse.command = function (name, options, commandFunction) {
  if (commandFunction == null) {
    return cliparseCommand(name, options);
  }

  return cliparseCommand(name, options, (...args) => {
    commandFunction(...args).catch((error) => {
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

// Patch cliparse.cli to:
// - simplify the help command behavior
// - sort commands by name
const cliparseCli = cliparse.cli;
cliparse.cli = function (options) {
  const { helpCommandDescription, commands = [], ...rest } = options;

  if (helpCommandDescription) {
    cliparseCommands.helpCommand.description = helpCommandDescription;
  }

  const allCommands = [...commands, cliparseCommands.helpCommand];
  const sortedCommands = allCommands.sort((a, b) => a.name.localeCompare(b.name));

  return cliparseCli({ ...rest, commands: sortedCommands, helpCommand: false });
};

export default cliparse;
