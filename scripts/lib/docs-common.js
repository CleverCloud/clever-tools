import { isRequired } from './schema-helpers.js';

/**
 * @typedef {import('../../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('../../src/lib/define-argument.types.js').ArgumentDefinition} ArgumentDefinition
 */

/**
 * Escapes pipe characters and newlines for markdown tables.
 * @param {string} str
 * @return {string}
 */
export function escapeTableCell(str) {
  if (str == null) return '-';
  return String(str).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Formats a list of items as inline code.
 * @param {string[]} items
 * @return {string}
 */
export function formatCodeList(items) {
  return items.map((item) => `\`${item}\``).join(', ');
}

/**
 * Generates the usage line for a command.
 * Format: clever <path> --required-opt <placeholder> <required-arg> [optional-arg] [options]
 * @param {string[]} path
 * @param {CommandDefinition} definition
 * @return {string}
 */
export function getCommandUsageMarkdown(path, definition) {
  const parts = [`clever ${path.join(' ')}`];

  const options = definition.options;
  const args = definition.args;

  // Required options (no default, not optional)
  if (options) {
    for (const [name, option] of Object.entries(options)) {
      if (isRequired(option.schema)) {
        const placeholder = option.placeholder ?? name;
        parts.push(`--${name} <${placeholder}>`);
      }
    }
  }

  // Required arguments then optional ones
  if (args) {
    for (const arg of /** @type {ArgumentDefinition[]} */ (args)) {
      if (isRequired(arg.schema)) {
        parts.push(`<${arg.placeholder}>`);
      } else {
        parts.push(`[${arg.placeholder}]`);
      }
    }
  }
  // [options] if there are non-required options
  const hasOptionalOptions = options && Object.values(options).some((opt) => !isRequired(opt.schema));
  if (hasOptionalOptions) {
    parts.push('[options]');
  }

  return `\`\`\`bash\n${parts.join(' ')}\n\`\`\``;
}
