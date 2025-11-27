#!/usr/bin/env node

// WARNING: this needs to run before other imports
import '../src/initial-setup.js';
import '../src/initial-update-notifier.js';
// Other imports
import _sortBy from 'lodash/sortBy.js';
import pkg from '../package.json' with { type: 'json' };
import { curl } from '../src/commands/curl.js';
import { globalCommands } from '../src/commands2/global.commands.js';
import { colorOption, updateNotifierOption, verboseOption } from '../src/commands2/global.options.js';
import { EXPERIMENTAL_FEATURES } from '../src/experimental-features.js';
import cliparse from '../src/lib/cliparse-patched.js';
import { styleText } from '../src/lib/style-text.js';
import { getFeatures } from '../src/models/configuration.js';

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

/**
 * Check if a Zod schema is a boolean type
 * @param {Object} schema - Zod schema
 * @returns {boolean}
 */
function isBooleanSchema(schema) {
  if (!schema?._def) return false;
  // Handle .default() wrapped schemas
  if (schema._def.innerType) {
    return schema._def.innerType.type === 'boolean' || schema._def.innerType._def?.type === 'boolean';
  }
  return schema._def.type === 'boolean';
}

/**
 * Check if a Zod schema has a default value
 * @param {Object} schema - Zod schema
 * @returns {boolean}
 */
function hasDefaultValue(schema) {
  return schema?._def?.typeName === 'ZodDefault' || schema?._def?.defaultValue !== undefined;
}

/**
 * Check if a Zod schema is optional
 * @param {Object} schema - Zod schema
 * @returns {boolean}
 */
function isOptionalSchema(schema) {
  return schema?._def?.typeName === 'ZodOptional' || schema?._def?.type === 'optional';
}

/**
 * Get enum values from a Zod schema if it's an enum type
 * @param {Object} schema - Zod schema
 * @returns {string[]|null} Array of enum values or null if not an enum
 */
function getEnumValues(schema) {
  if (!schema?._def) return null;

  // Handle .default() wrapped schemas
  const innerSchema = schema._def.innerType ?? schema;

  // Check for enum type and get options
  if (innerSchema.type === 'enum' && innerSchema.options) {
    return innerSchema.options;
  }
  // Also check _def for older Zod versions
  if (innerSchema._def?.typeName === 'ZodEnum') {
    return innerSchema._def.values;
  }
  return null;
}

/**
 * Extract transform function from a Zod schema if it has one
 * Handles wrapped schemas (optional, default, etc.)
 * @param {Object} schema - Zod schema
 * @returns {Function|null} Transform function or null
 */
function getTransformParser(schema) {
  if (!schema?._def) return null;

  // Zod 4: pipe with transform in "out"
  if (schema._def.type === 'pipe' && schema._def.out?.def?.type === 'transform') {
    return schema._def.out.def.transform;
  }

  // Zod 4: direct transform type
  if (schema._def.type === 'transform' && schema._def.transform) {
    return schema._def.transform;
  }

  // Handle wrapped schemas (optional, default, etc.)
  if (schema._def.innerType) {
    return getTransformParser(schema._def.innerType);
  }

  return null;
}

/**
 * Convert an option definition to cliparse format
 * @param {Object} option - Option definition from global.options.js
 * @returns {Object} cliparse option or flag
 */
function convertOption(option) {
  const config = {
    description: option.description,
  };

  if (option.aliases) {
    config.aliases = option.aliases;
  }
  if (hasDefaultValue(option.schema)) {
    config.default = option.schema._def.defaultValue;
  }
  if (option.placeholder) {
    config.metavar = option.placeholder;
  }
  if (option.complete) {
    config.complete = option.complete;
  }

  // Auto-generate parser for Zod enums if no explicit parser provided
  if (!config.parser) {
    const enumValues = getEnumValues(option.schema);
    if (enumValues) {
      config.parser = (value) => {
        if (!enumValues.includes(value)) {
          throw new Error(`must be one of: ${enumValues.join(', ')}`);
        }
        return value;
      };
    }
  }

  // Extract transform function from Zod schema as parser
  if (!config.parser) {
    const transformParser = getTransformParser(option.schema);
    if (transformParser) {
      config.parser = transformParser;
    }
  }

  // Mark as required if schema has no default and is not optional
  if (!hasDefaultValue(option.schema) && !isOptionalSchema(option.schema)) {
    config.required = true;
  }

  // Boolean schemas become cliparse flags, others become cliparse options
  if (isBooleanSchema(option.schema)) {
    return cliparse.flag(option.name, config);
  } else {
    return cliparse.option(option.name, config);
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

  if (arg.complete) {
    config.complete = arg.complete;
  }

  // Auto-generate parser for Zod enums if no explicit parser provided
  if (!config.parser) {
    const enumValues = getEnumValues(arg.schema);
    if (enumValues) {
      config.parser = (value) => {
        if (!enumValues.includes(value)) {
          throw new Error(`must be one of: ${enumValues.join(', ')}`);
        }
        return value;
      };
    }
  }

  // Extract transform function from Zod schema as parser
  if (!config.parser) {
    const transformParser = getTransformParser(arg.schema);
    if (transformParser) {
      config.parser = transformParser;
    }
  }

  if (hasDefaultValue(arg.schema)) {
    config.default = arg.schema._def.defaultValue;
  } else if (isOptionalSchema(arg.schema)) {
    config.default = '';
  }

  return cliparse.argument(arg.placeholder, config);
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
  const globalOptionNames = ['color', 'update-notifier', 'verbose'];

  const privateOptions = [];

  if (commandDef.options) {
    for (const [optionName, option] of Object.entries(commandDef.options)) {
      // Skip global options - they're at root level
      if (globalOptionNames.includes(optionName)) {
        continue;
      }

      // All non-global options go to cliparse privateOptions
      privateOptions.push(convertOption(option));
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

  // Build the handler function wrapper
  // Note: cliparse-patched.js calls with (options, ...args) not (params)
  const handlerFunction = commandDef.handler
    ? async (options, ...args) => {
        return commandDef.handler(options, ...args);
      }
    : null;

  return cliparse.command(name, config, handlerFunction);
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
  if (commandDef.isExperimental && commandDef.featureFlag) {
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

  // CLI PARSER
  const cliParser = cliparse.cli({
    name: 'clever',
    description: "CLI tool to manage Clever Cloud's data and products",
    version: pkg.version,
    options: [convertOption(colorOption), convertOption(updateNotifierOption), convertOption(verboseOption)],
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
