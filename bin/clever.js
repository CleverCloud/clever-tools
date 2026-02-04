#!/usr/bin/env node

// WARNING: this needs to run before other imports
import '../src/initial-setup.js';
import '../src/initial-update-notifier.js';
// Other imports
import pkg from '../package.json' with { type: 'json' };
import { curl } from '../src/commands/curl/curl.command.js';
import { globalCommands } from '../src/commands/global.commands.js';
import {
  colorOption,
  helpOption,
  updateNotifierOption,
  verboseOption,
  versionOption,
} from '../src/commands/global.options.js';
import { EXPERIMENTAL_FEATURES, getFeatures } from '../src/config/features.js';
import { cliparse } from '../src/lib/cliparse-patched.js';
import { styleText } from '../src/lib/style-text.js';
import { getDefault, isBoolean, isRequired } from '../src/lib/zod-utils.js';

/**
 * @typedef {import('../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('../src/lib/define-option.types.js').OptionDefinition} OptionDefinition
 * @typedef {import('../src/lib/define-argument.types.js').ArgumentDefinition} ArgumentDefinition
 */

/**
 * A command entry in the globalCommands structure.
 * Can be either a command definition or a tuple of [command, subcommands].
 * @typedef {CommandDefinition | [CommandDefinition, Record<string, CommandEntry>]} CommandEntry
 */

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

// Right now, this is the only way to do this properly
// cliparse doesn't allow unknown options/arguments
if (process.argv[2] === 'curl') {
  curl().catch(() => process.exit(1));
} else {
  run().catch(() => process.exit(1));
}

async function run() {
  // Get enabled experimental features
  /** @type {Record<string, boolean>} */
  const featuresFromConf = await getFeatures();

  // Build all commands from globalCommands
  const commands = [];
  for (const [name, entry] of /** @type {[string, CommandEntry][]} */ (Object.entries(globalCommands))) {
    const command = buildCommand(name, entry, featuresFromConf);
    if (command != null) {
      commands.push(command);
    }
  }

  const rootCommandDefinition = {
    description: "CLI tool to manage Clever Cloud's data and products",
    options: {
      help: helpOption,
      version: versionOption,
      verbose: verboseOption,
      color: colorOption,
      'update-notifier': updateNotifierOption,
    },
  };

  // Add help command and sort all commands
  const sortedCommands = commands.sort((a, b) => a.name.localeCompare(b.name));

  const cliParser = cliparse.cli({
    name: 'clever',
    description: rootCommandDefinition.description,
    version: pkg.version,
    options: [convertOption(colorOption), convertOption(updateNotifierOption), convertOption(verboseOption)],
    helpCommand: false,
    commands: sortedCommands,
  });

  // Attach root definition so cliparse-patched.js can use it for --help display
  cliParser._definition = rootCommandDefinition;

  // Make sure argv[0] is always "node"
  const cliArgs = process.argv;
  cliArgs[0] = 'node';
  cliparse.parse(cliParser, cliArgs);
}

/**
 * Recursively build commands from the global commands structure
 * @param {string} name - Command name
 * @param {CommandEntry} commandEntry - Command entry (either a command object or [command, subcommands])
 * @param {Record<string, boolean>} featuresFromConf - Enabled features configuration
 * @returns {Object|null} cliparse command or null if filtered out
 */
function buildCommand(name, commandEntry, featuresFromConf) {
  /** @type {CommandDefinition} */
  let commandDef;
  /** @type {Record<string, CommandEntry>} */
  let subcommandsMap = {};

  // Handle both formats: plain object or [command, {subcommands}]
  if (Array.isArray(commandEntry)) {
    [commandDef, subcommandsMap] = commandEntry;
  } else {
    commandDef = commandEntry;
  }

  // Check if this is an experimental feature that needs to be enabled
  if (commandDef.featureFlag && !featuresFromConf[commandDef.featureFlag]) {
    return null;
  }

  // Build subcommands recursively
  const subcommands = [];
  for (const [subName, subEntry] of Object.entries(subcommandsMap)) {
    const subcommand = buildCommand(subName, subEntry, featuresFromConf);
    if (subcommand != null) {
      subcommands.push(subcommand);
    }
  }

  // Build the command
  const command = convertCommand(name, commandDef, subcommands);

  // Add experimental styling if needed
  if (commandDef.isExperimental && commandDef.featureFlag) {
    const featureInfo = EXPERIMENTAL_FEATURES[commandDef.featureFlag];
    if (featureInfo != null) {
      const status = featureInfo.status;
      command.description = styleText('yellow', command.description + ' [' + status.toUpperCase() + ']');
    }
  }

  return command;
}

/**
 * Convert a command definition to cliparse format
 * @param {string} name - Command name
 * @param {CommandDefinition} commandDef - Command definition object
 * @param {Object[]} subcommands - Array of cliparse subcommands
 * @returns {Object} cliparse command
 */
function convertCommand(name, commandDef, subcommands = []) {
  const cliparseConfig = {
    description: commandDef.description,
  };

  if (commandDef.options != null) {
    cliparseConfig.privateOptions = Object.values(commandDef.options).map(convertOption);
  }

  // Convert arguments
  if (commandDef.args != null && commandDef.args.length > 0) {
    cliparseConfig.args = commandDef.args.map(convertArgument);
  }

  // Add subcommands
  if (subcommands.length > 0) {
    cliparseConfig.commands = subcommands;
  }

  const command = cliparse.command(name, cliparseConfig, commandDef.handler);

  // Attach the original definition so cliparse-patched.js can use it for --help display
  command._definition = commandDef;

  return command;
}

/**
 * Convert an option definition to cliparse format
 * @param {OptionDefinition} option - Option definition from global.options.js
 * @returns {Object} cliparse option
 */
function convertOption(option) {
  const cliparseConfig = {
    description: option.description,
  };

  if (option.aliases != null) {
    cliparseConfig.aliases = option.aliases;
  }
  const optionDefault = getDefault(option.schema);
  if (optionDefault != null) {
    // Parse the default value through the schema to apply transforms
    const parsed = option.schema.safeParse(optionDefault);
    cliparseConfig.default = parsed.success ? parsed.data : optionDefault;
  }
  if (option.placeholder != null) {
    cliparseConfig.metavar = option.placeholder;
  }
  if (option.complete != null) {
    cliparseConfig.complete = option.complete;
  }

  // Use Zod's safeParse for validation (handles coercion, enums, refinements, etc.)
  cliparseConfig.parser = (value) => {
    // Log deprecation warning if option is deprecated
    if (option.deprecated) {
      const message = typeof option.deprecated === 'string' ? `, ${option.deprecated}.` : '';
      console.error(styleText('yellow', `Warning: --${option.name} is deprecated${message}`));
    }

    const result = option.schema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(', '));
    }
    return result.data;
  };

  // Mark as required if schema has no default and is not optional
  if (isRequired(option.schema)) {
    cliparseConfig.required = true;
  }

  // Boolean schemas: use cliparse.option with expects_value: false (like cliparse.flag does)
  if (isBoolean(option.schema)) {
    // eslint-disable-next-line camelcase -- cliparse API uses snake_case
    cliparseConfig.expects_value = false;
  }

  return cliparse.option(option.name, cliparseConfig);
}

/**
 * Convert an argument definition to cliparse format
 * @param {ArgumentDefinition} arg - Argument definition
 * @returns {Object} cliparse argument
 */
function convertArgument(arg) {
  const cliparseConfig = {
    description: arg.description,
  };

  if (arg.complete) {
    cliparseConfig.complete = arg.complete;
  }

  // Use Zod's safeParse for validation (handles coercion, enums, refinements, etc.)
  cliparseConfig.parser = (value) => {
    const result = arg.schema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(', '));
    }
    return result.data;
  };

  const argDefault = getDefault(arg.schema);
  if (argDefault != null) {
    // Parse the default value through the schema to apply transforms
    const parsed = arg.schema.safeParse(argDefault);
    cliparseConfig.default = parsed.success ? parsed.data : argDefault;
  } else if (!isRequired(arg.schema)) {
    cliparseConfig.default = '';
  }

  return cliparse.argument(arg.placeholder, cliparseConfig);
}
