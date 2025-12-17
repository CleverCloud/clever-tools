import { getDefault, isBoolean, isRequired } from './zod-utils.js';

/**
 * @typedef {import('./get-command-info.types.d.ts').ArgumentInfo} ArgumentInfo
 * @typedef {import('./get-command-info.types.d.ts').OptionInfo} OptionInfo
 * @typedef {import('./get-command-info.types.d.ts').CommandInfo} CommandInfo
 * @typedef {import('./define-command.types.d.ts').CommandDefinition} CommandDefinition
 * @typedef {import('./define-option.types.d.ts').OptionDefinition} OptionDefinition
 */

/**
 * Extracts normalized command information for display purposes.
 * This function provides a shared source of truth for CLI help, reference docs, and LLM docs.
 * @param {string[]} path - Command path (e.g., ['env', 'set'])
 * @param {CommandDefinition} definition
 * @return {CommandInfo}
 */
export function getCommandInfo(path, definition) {
  const usageParts = ['clever', ...path];
  if (definition.options != null) {
    for (const option of Object.values(definition.options)) {
      if (isRequired(option.schema)) {
        usageParts.push(`--${option.name} <${option.placeholder ?? option.name}>`);
      }
    }
  }
  if (definition.args != null) {
    for (const arg of definition.args) {
      if (isRequired(arg.schema)) {
        usageParts.push(`<${arg.placeholder}>`);
      } else {
        usageParts.push(`[<${arg.placeholder}>]`);
      }
    }
  }
  if (definition.options != null && Object.keys(definition.options).length > 0) {
    usageParts.push('[options]');
  }
  const usage = usageParts.join(' ');

  // Build args info (sorted by position, i.e., as defined)
  const args = definition.args?.length
    ? definition.args.map((arg) => {
        return {
          name: arg.placeholder,
          description: arg.description,
          optional: isRequired(arg.schema) ? null : '(optional)',
        };
      })
    : null;

  // Build options info (sorted: required first, then alphabetically)
  const optionValues = Object.values(definition.options ?? {});
  const options = optionValues.length
    ? optionValues
        .sort((optA, optB) => {
          const aRequired = isRequired(optA.schema);
          const bRequired = isRequired(optB.schema);
          if (aRequired !== bRequired) return aRequired ? -1 : 1;
          return optA.name.localeCompare(optB.name);
        })
        .map((option) => {
          const shortAliases = (option.aliases?.filter((a) => a.length === 1) ?? []).map((a) => `-${a}`);
          const longAliases = (option.aliases?.filter((a) => a.length > 1) ?? []).map((a) => `--${a}`);
          const allAliases = [...shortAliases, `--${option.name}`, ...longAliases];
          const defaultValue = getDefault(option.schema);

          return {
            name: option.name,
            aliases: allAliases,
            placeholder: isBoolean(option.schema) ? null : `<${option.placeholder ?? option.name}>`,
            description: option.description,
            deprecated:
              typeof option.deprecated === 'string'
                ? `(deprecated, ${option.deprecated})`
                : option.deprecated === true
                  ? '(deprecated)'
                  : null,
            required: isRequired(option.schema) ? '(required)' : null,
            default: defaultValue ? `(default: ${defaultValue})` : null,
          };
        })
    : null;

  return { usage, args, options };
}
