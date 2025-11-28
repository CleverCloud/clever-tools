import cliparse from 'cliparse';
import cliparseCommands from 'cliparse/src/command.js';
import semver from 'semver';
import pkg from '../../package.json' with { type: 'json' };
import { Logger } from '../logger.js';
import { styleText } from './style-text.js';

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
