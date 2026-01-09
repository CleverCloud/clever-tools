import cliparseOriginal from 'cliparse';
import cliparseCommandModule from 'cliparse/src/command.js';
import semver from 'semver';
import pkg from '../../package.json' with { type: 'json' };
import { Logger } from '../logger.js';
import { getCommandInfo } from './get-command-info.js';
import { styleText } from './style-text.js';

// Patch cliparse.command so we can catch errors
const cliparseCommand = cliparseOriginal.command;
cliparseOriginal.command = function (name, options, commandFunction) {
  if (commandFunction == null) {
    return cliparseCommand(name, options);
  }

  const command = cliparseCommand(name, options, (params) => {
    const args = params.args ?? [];
    // Map options from cliparse format (using option.name as key, e.g. 'index-prefix')
    // to the original keys from the command definition (e.g. 'indexPrefix')
    const mappedOptions = mapOptionsToDefinitionKeys(params.options, command._definition);
    const promise = commandFunction(mappedOptions, ...args);
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
  return command;
};

/**
 * Map options from cliparse format (using option.name) to the original definition keys.
 * For example, { theOptionName: defineOption({ name: 'the-option-name', ... }) },
 * cliparse will return { 'the-option-name': value }, and we need to convert it to { theOptionName: value }.
 * @param {Record<string, unknown>} options - Options object from cliparse with option.name as keys
 * @param {CommandDefinition} definition - Command definition
 * @returns {Record<string, unknown>} Options object with original definition keys
 */
function mapOptionsToDefinitionKeys(options, definition) {
  if (!definition?.options) {
    return options;
  }

  // Build a reverse map: option.name -> definition key
  const nameToKey = new Map();
  for (const [key, optionDef] of Object.entries(definition.options)) {
    nameToKey.set(optionDef.name, key);
  }

  // Map options to use definition keys
  const mappedOptions = {};
  for (const [name, value] of Object.entries(options)) {
    const key = nameToKey.get(name) ?? name;
    mappedOptions[key] = value;
  }

  return mappedOptions;
}

/**
 * Patched help function for cliparse commands.
 * Called internally by cliparse when --help is used.
 * Generates formatted help output with usage, arguments, options, and subcommands.
 * @param {Array<{name: string, description: string, commands: Array, _definition: CommandDefinition}>} context - Command context stack
 * @returns {string} Formatted help text
 */
cliparseCommandModule.help = function (context) {
  const cmd = context.at(-1);
  const path = context.slice(1).map((c) => c.name);
  const commandInfo = getCommandInfo(path, cmd._definition);

  const allRows = [];

  let argumentsRows;
  if (commandInfo.args) {
    argumentsRows = commandInfo.args.map((arg) => {
      let description = arg.description;
      if (arg.optional) description += ` ${styleText('dim', arg.optional)}`;
      return [arg.name, description];
    });
    allRows.push(...argumentsRows);
  }

  let optionsRows;
  if (commandInfo.options) {
    optionsRows = commandInfo.options.map((opt) => {
      const placeholder = opt.placeholder ? ` ${opt.placeholder}` : '';
      const aliasesPadding = opt.aliases[0].length === 2 ? '' : '    ';
      const aliases = aliasesPadding + opt.aliases.join(', ') + placeholder;
      let description = opt.description;
      if (opt.deprecated) description += ` ${styleText('dim', opt.deprecated)}`;
      if (opt.required) description += ` ${styleText('dim', opt.required)}`;
      if (opt.default) description += ` ${styleText('dim', opt.default)}`;
      return [aliases, description];
    });
    allRows.push(...optionsRows);
  }

  const availableCommandsRows = cmd.commands.map((cmd) => [cmd.name, cmd.description.split('\n')[0]]);
  allRows.push(...availableCommandsRows);

  const firstColumnWith = Math.max(...allRows.map(([cell]) => cell.length));

  const parts = [cmd._definition.description];

  parts.push(formatSection('USAGE', [commandInfo.usage]));
  if (availableCommandsRows.length > 0) {
    parts.push(formatSectionWithColumns('COMMANDS', availableCommandsRows, firstColumnWith));
  }
  if (argumentsRows) {
    parts.push(formatSectionWithColumns('ARGUMENTS', argumentsRows, firstColumnWith));
  }
  if (optionsRows) {
    parts.push(formatSectionWithColumns('OPTIONS', optionsRows, firstColumnWith));
  }
  if (cmd._definition.examples?.length > 0) {
    parts.push(formatSection('EXAMPLES', cmd._definition.examples));
  }

  return parts.join('\n\n');
};

/**
 * @param {string} title
 * @param {Array<string>} lines
 */
function formatSection(title, lines) {
  return [styleText('bold', title), ...lines.map((l) => `  ${l}`)].join('\n');
}

/**
 * @param {string} title
 * @param {string[][]} rows
 * @param {number} firstColumnWidth
 */
function formatSectionWithColumns(title, rows, firstColumnWidth) {
  const lines = rows.map(([firstColumn, otherColumn]) => firstColumn.padEnd(firstColumnWidth + 4, ' ') + otherColumn);
  return formatSection(title, lines);
}

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
const cliparseOption = cliparseOriginal.option;
cliparseOriginal.option = function (name, options) {
  if (options?.parser != null) {
    options.parser = wrapParser(options.parser);
  }
  if (options?.complete != null) {
    options.complete = wrapComplete(options.complete);
  }
  return cliparseOption(name, options);
};

// Patch cliparse.argument to wrap parser and complete functions
const cliparseArgument = cliparseOriginal.argument;
cliparseOriginal.argument = function (name, options) {
  if (options?.parser != null) {
    options.parser = wrapParser(options.parser);
  }
  if (options?.complete != null) {
    options.complete = wrapComplete(options.complete);
  }
  return cliparseArgument(name, options);
};

export const cliparse = cliparseOriginal;
