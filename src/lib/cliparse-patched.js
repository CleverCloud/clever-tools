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
