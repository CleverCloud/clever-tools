#!/usr/bin/env node

// WARNING: this needs to run before other imports
import '../src/initial-setup.js';
import '../src/initial-update-notifier.js';
// Other imports
import cliparse from 'cliparse';
import _sortBy from 'lodash/sortBy.js';
import pkg from '../package.json' with { type: 'json' };
import { handleCommandPromise } from '../src/command-promise-handler.js';
import { curl } from '../src/commands/curl.js';
import { globalCommands } from '../src/commands/global.commands.js';
import { EXPERIMENTAL_FEATURES } from '../src/experimental-features.js';
import { styleText } from '../src/lib/style-text.js';
import { getFeatures } from '../src/models/configuration.js';

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

// Patch cliparse.command so we can catch errors
const cliparseCommand = cliparse.command;

cliparse.command = function (name, options, commandFunction) {
  if (commandFunction == null) {
    return cliparseCommand(name, options);
  }

  return cliparseCommand(name, options, (...args) => {
    const promise = commandFunction(...args);
    handleCommandPromise(promise);
  });
};

/**
 * Convert an option definition to cliparse format
 * @param {Object} opt - Option definition from global.opts.js
 * @returns {Object} cliparse option or flag
 */
function convertOption(opt) {
  const config = {
    description: opt.description,
  };

  if (opt.aliases) {
    config.aliases = opt.aliases;
  }
  if (opt.default !== null && opt.default !== undefined) {
    config.default = opt.default;
  }
  if (opt.metavar) {
    config.metavar = opt.metavar;
  }
  if (opt.required) {
    config.required = opt.required;
  }
  if (opt.parser) {
    config.parser = opt.parser;
  }
  if (opt.complete) {
    config.complete = opt.complete;
  }

  if (opt.type === 'flag') {
    return cliparse.flag(opt.name, config);
  } else {
    return cliparse.option(opt.name, config);
  }
}

/**
 * Convert an argument definition to cliparse format
 * @param {Object} arg - Argument definition
 * @returns {Object} cliparse argument
 */
function convertArgument(arg) {
  const config = {
    description: arg.description,
  };

  if (arg.parser) {
    config.parser = arg.parser;
  }
  if (arg.complete) {
    config.complete = arg.complete;
  }
  if (arg.default !== undefined) {
    config.default = arg.default;
  }

  return cliparse.argument(arg.name, config);
}

/**
 * Build a cliparse command from a command definition
 * @param {string} name - Command name
 * @param {Object} commandDef - Command definition object
 * @param {Object[]} subcommands - Array of cliparse subcommands
 * @param {boolean} hasSubcommands - Whether this command has subcommands
 * @returns {Object} cliparse command
 */
function buildCliparseCommand(name, commandDef, subcommands = [], hasSubcommands = false) {
  const config = {
    description: commandDef.description,
  };

  // Global options that are handled at root level
  const globalOptNames = ['color', 'update-notifier', 'verbose'];

  const privateOptions = [];

  if (commandDef.opts) {
    for (const [optName, opt] of Object.entries(commandDef.opts)) {
      // Skip global options - they're at root level
      if (globalOptNames.includes(optName)) {
        continue;
      }

      // All non-global options go to privateOptions
      privateOptions.push(convertOption(opt));
    }
  }

  if (privateOptions.length > 0) {
    config.privateOptions = privateOptions;
  }

  // Convert arguments
  if (commandDef.args && commandDef.args.length > 0) {
    config.args = commandDef.args.map(convertArgument);
  }

  // Add subcommands
  if (subcommands.length > 0) {
    config.commands = subcommands;
  }

  // Build the execute function wrapper
  const executeFunction = commandDef.execute
    ? async (params) => {
        return commandDef.execute(params);
      }
    : null;

  return cliparse.command(name, config, executeFunction);
}

/**
 * Recursively build commands from the global commands structure
 * @param {string} name - Command name
 * @param {Object|Array} commandEntry - Command entry (either a command object or [command, subcommands])
 * @param {Object} featuresFromConf - Enabled features configuration
 * @returns {Object|null} cliparse command or null if filtered out
 */
function buildCommand(name, commandEntry, featuresFromConf) {
  let commandDef;
  let subcommandsMap = {};

  // Handle both formats: plain object or [command, {subcommands}]
  if (Array.isArray(commandEntry)) {
    [commandDef, subcommandsMap] = commandEntry;
  } else {
    commandDef = commandEntry;
  }

  // Check if this is an experimental feature that needs to be enabled
  if (commandDef.featureFlag) {
    if (!featuresFromConf[commandDef.featureFlag]) {
      return null;
    }
  }

  // Build subcommands recursively
  const subcommands = [];
  for (const [subName, subEntry] of Object.entries(subcommandsMap)) {
    const subcommand = buildCommand(subName, subEntry, featuresFromConf);
    if (subcommand) {
      subcommands.push(subcommand);
    }
  }

  // Build the command
  let command = buildCliparseCommand(name, commandDef, subcommands);

  // Add experimental styling if needed
  if (commandDef.experimental && commandDef.featureFlag) {
    const featureInfo = EXPERIMENTAL_FEATURES[commandDef.featureFlag];
    if (featureInfo) {
      const status = featureInfo.status;
      command.description = styleText('yellow', command.description + ' [' + status.toUpperCase() + ']');
    }
  }

  return command;
}

async function run() {
  // Get enabled experimental features
  const featuresFromConf = await getFeatures();

  // Build all commands from globalCommands
  const commands = [];
  for (const [name, entry] of Object.entries(globalCommands)) {
    const command = buildCommand(name, entry, featuresFromConf);
    if (command) {
      commands.push(command);
    }
  }

  // Global options (these are added at the CLI root level)
  const globalOptions = [
    cliparse.flag('color', {
      description: 'Choose whether to print colors or not. You can also use --no-color',
      default: true,
    }),
    cliparse.flag('update-notifier', {
      description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
      default: true,
    }),
    cliparse.flag('verbose', {
      aliases: ['v'],
      description: 'Verbose output',
    }),
  ];

  // CLI PARSER
  const cliParser = cliparse.cli({
    name: 'clever',
    description: "CLI tool to manage Clever Cloud's data and products",
    version: pkg.version,
    options: globalOptions,
    helpCommand: false,
    commands: _sortBy(commands, 'name'),
  });

  // Make sure argv[0] is always "node"
  const cliArgs = process.argv;
  cliArgs[0] = 'node';
  cliparse.parse(cliParser, cliArgs);
}

// Right now, this is the only way to do this properly
// cliparse doesn't allow unknown options/arguments
if (process.argv[2] === 'curl') {
  curl();
} else {
  run();
}
