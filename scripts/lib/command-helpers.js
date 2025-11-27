/**
 * Shared helpers for working with command definitions from globalCommands.
 * Used by generate-cli-markdown-docs.js and llm-doc-gen-v2.js.
 */

/**
 * @typedef {Object} FlatCommand
 * @property {string} path - Full command path (e.g., "addon create")
 * @property {string} id - Kebab-case id (e.g., "addon-create")
 * @property {Object} command - The command definition
 */

/**
 * Flattens the command tree into a list of commands with their full paths.
 * Commands are sorted alphabetically at each level.
 * @param {Object} commands - The globalCommands object or subcommands
 * @param {string} [prefix=''] - Current command path prefix
 * @returns {FlatCommand[]}
 */
export function flattenCommands(commands, prefix = '') {
  const result = [];

  // Sort command names alphabetically
  const sortedEntries = Object.entries(commands).sort(([a], [b]) => a.localeCompare(b));

  for (const [name, entry] of sortedEntries) {
    const currentPath = prefix ? `${prefix} ${name}` : name;
    const currentId = currentPath.replace(/ /g, '-');

    if (Array.isArray(entry)) {
      // [command, {subcommands}] format
      const [command, subcommands] = entry;
      result.push({ path: currentPath, id: currentId, command });

      if (subcommands) {
        result.push(...flattenCommands(subcommands, currentPath));
      }
    } else {
      // Plain command object
      result.push({ path: currentPath, id: currentId, command: entry });
    }
  }

  return result;
}

/**
 * Sorts option entries alphabetically by name.
 * @param {Array<[string, Object]>} optionEntries - Array of [name, option] pairs
 * @returns {Array<[string, Object]>}
 */
export function sortOptions(optionEntries) {
  return [...optionEntries].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Groups flattened commands by their root command name.
 * @param {FlatCommand[]} commands
 * @returns {Map<string, FlatCommand[]>}
 */
export function groupByRoot(commands) {
  const groups = new Map();

  for (const cmd of commands) {
    const root = cmd.path.split(' ')[0];
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root).push(cmd);
  }

  return groups;
}

/**
 * Extracts the default value from a Zod schema.
 * @param {object} schema - Zod schema
 * @returns {*} The default value or undefined
 */
export function getSchemaDefault(schema) {
  if (!schema) return undefined;

  let current = schema;
  while (current) {
    const schemaType = current.def?.type || current.type;

    if (schemaType === 'default') {
      return current.def?.defaultValue;
    }

    // Check for wrapper types (optional, nullable) and unwrap
    if (schemaType === 'optional' || schemaType === 'nullable') {
      current = current.def?.innerType || current.innerType;
      continue;
    }

    break;
  }

  return undefined;
}

/**
 * Determines if a schema is required (not optional/nullable and no default).
 * Note: This checks the schema structure, not explicit required flags.
 * @param {object} schema - Zod schema
 * @returns {boolean}
 */
export function isSchemaRequired(schema) {
  if (!schema) return false;

  let current = schema;
  while (current) {
    const schemaType = current.def?.type || current.type;

    // If it has a default, it's not required
    if (schemaType === 'default') {
      return false;
    }

    // If it's optional or nullable, it's not required
    if (schemaType === 'optional' || schemaType === 'nullable') {
      return false;
    }

    break;
  }

  return true;
}

/**
 * Determines if a schema is explicitly optional (has optional/nullable wrapper or default).
 * @param {object} schema - Zod schema
 * @returns {boolean}
 */
export function isSchemaOptional(schema) {
  if (!schema) return false;

  let current = schema;
  while (current) {
    const schemaType = current.def?.type || current.type;

    // If it has a default, optional, or nullable, it's optional
    if (schemaType === 'default' || schemaType === 'optional' || schemaType === 'nullable') {
      return true;
    }

    break;
  }

  return false;
}

/**
 * Determines if a flag is a boolean flag from its Zod schema.
 * Handles nested structures like z.boolean().default(false) and z.boolean().optional().
 * @param {Object} flag - Flag definition with schema property
 * @returns {boolean}
 */
export function isBooleanFlag(flag) {
  if (!flag.schema) return false;

  // Navigate through the schema structure to find the innermost type
  let current = flag.schema;
  while (current) {
    const schemaType = current.def?.type || current.type;

    if (schemaType === 'boolean') {
      return true;
    }

    // Check for wrapper types (default, optional, nullable) and unwrap
    if (schemaType === 'default' || schemaType === 'optional' || schemaType === 'nullable') {
      current = current.def?.innerType || current.innerType;
      continue;
    }

    break;
  }

  return false;
}

/**
 * Escapes pipe characters for markdown tables.
 * @param {string} str
 * @returns {string}
 */
export function escapeTableCell(str) {
  if (str == null) return '-';
  return String(str).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Formats a default value for display.
 * @param {*} value
 * @returns {string}
 */
export function formatDefault(value) {
  if (value === null || value === undefined) return 'none';
  if (value === '') return '`""`';
  if (typeof value === 'boolean') return `\`${String(value)}\``;
  return `\`${escapeTableCell(String(value))}\``;
}

/**
 * Formats an option description with default value and required marker.
 * Only shows (required) for options that are explicitly required (rare).
 * @param {string} description
 * @param {*} defaultValue
 * @param {boolean} isRequired - true only if option has explicit required flag
 * @returns {string}
 */
export function formatOptionDescription(description, defaultValue, isRequired) {
  const parts = [escapeTableCell(description)];

  if (isRequired) {
    parts.push(' **(required)**');
  } else if (defaultValue !== null && defaultValue !== undefined && defaultValue !== '' && defaultValue !== false) {
    parts.push(` (default: ${formatDefault(defaultValue)})`);
  }

  return parts.join('');
}

/**
 * Formats an argument description with optional marker.
 * Arguments are required by default, only shows (optional) for those that aren't.
 * @param {string} description
 * @param {boolean} isOptional - true if argument is optional
 * @returns {string}
 */
export function formatArgDescription(description, isOptional) {
  const parts = [escapeTableCell(description)];

  if (isOptional) {
    parts.push(' *(optional)*');
  }

  return parts.join('');
}

/**
 * @deprecated Use formatOptionDescription or formatArgDescription instead
 */
export function formatDescription(description, defaultValue, isRequired) {
  return formatOptionDescription(description, defaultValue, isRequired);
}
