import dedent from 'dedent';
import { escapeTableCell, getCommandUsageMarkdown } from './docs-common.js';
import { getNodesBetweenH2, stringifyMarkdown } from './markdown.js';
import { getDefault, isBoolean, isRequired } from './schema-helpers.js';

/**
 * @typedef {import('../../src/lib/define-option.types.js').OptionDefinition} OptionDefinition
 * @typedef {import('../../src/lib/define-argument.types.js').ArgumentDefinition} ArgumentDefinition
 * @typedef {import('../../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').RootContent} MdastRootContent
 */

// Global options that are excluded from per-command options tables
const GLOBAL_OPTIONS = new Set(['color', 'verbose', 'update-notifier']);

/**
 * Returns the relative path for a root command's doc file.
 * @param {string} rootName
 * @return {string}
 */
export function getDocRelativePath(rootName) {
  return `./${rootName}/${rootName}.docs.md`;
}

/**
 * Generates the main README with the list of commands.
 * @param {Array<[string, unknown]>} commands
 * @param {{ colorOption: OptionDefinition, verboseOption: OptionDefinition, updateNotifierOption: OptionDefinition }} globalOptions
 * @param {(rootName: string) => string} getDocRelativePath
 * @return {string}
 */
export function getReadmeMarkdown(commands, globalOptions, getDocRelativePath) {
  const { colorOption, verboseOption, updateNotifierOption } = globalOptions;

  const commandRows = commands.map(([rootName, command]) => {
    const definition = Array.isArray(command) ? command[0] : command;
    const description = escapeTableCell(definition.description);
    const docPath = getDocRelativePath(rootName);
    return `|[\`clever ${rootName}\`](${docPath})|${description}|`;
  });

  return dedent`
    # clever-tools reference

    This directory contains the documentation for all \`clever\` CLI commands.

    ## ⚙️ Global options

    These options are available for all commands:

    |Name|Description|
    |---|---|
    |${getOptionAliases('color', colorOption)}|${escapeTableCell(colorOption.description)}|
    |${getOptionAliases('verbose', verboseOption)}|${escapeTableCell(verboseOption.description)}|
    |${getOptionAliases('update-notifier', updateNotifierOption)}|${escapeTableCell(updateNotifierOption.description)}|

    ## ➡️ Commands

    |Command|Description|
    |---|---|
    ${commandRows.join('\n')}
  `;
}


/**
 * Generates the aliases for an option.
 * Format: `-a`, `--name`, `--other-alias` `<placeholder>`
 * @param {string} name
 * @param {OptionDefinition} option
 * @param {(schema: any) => boolean} [isBooleanFn]
 * @return {string}
 */
export function getOptionAliases(name, option, isBooleanFn) {
  const parts = [];

  // Single-letter aliases first
  if (option.aliases) {
    for (const alias of option.aliases) {
      if (alias.length === 1) {
        parts.push(`\`-${alias}\``);
      }
    }
  }

  // Main name
  parts.push(`\`--${name}\``);

  // Other aliases (more than one letter)
  if (option.aliases) {
    for (const alias of option.aliases) {
      if (alias.length > 1) {
        parts.push(`\`--${alias}\``);
      }
    }
  }

  // Placeholder if not a boolean
  if (isBooleanFn && !isBooleanFn(option.schema)) {
    const placeholder = option.placeholder ?? name;
    parts.push(`\`<${placeholder}>\``);
  } else if (!isBooleanFn) {
    // Fallback for global options table (no schema check)
    const placeholder = option.placeholder ?? name;
    if (placeholder !== name || !option.schema) {
      parts.push(`\`<${placeholder}>\``);
    }
  }

  return parts.join(', ');
}

/**
 * Generates the experimental note for a command.
 * @param {CommandDefinition} definition
 * @return {string}
 */
export function getExperimentalNote(definition) {
  if (!definition.isExperimental) {
    return '';
  }

  const lines = ['> [!NOTE]', '> 🧪 **Experimental**: This command may change or be removed in future versions.'];

  if (definition.featureFlag) {
    lines.push(`> Enable with: \`clever features enable ${definition.featureFlag}\``);
  }

  return lines.join('\n');
}

/**
 * Generates the full markdown for a root command and all its subcommands.
 * @param {string} name
 * @param {unknown} command
 * @param {MdastRoot | null} ast
 * @return {string}
 */
export function getRootCommandMarkdown(name, command, ast) {
  const parts = [`# 📖 \`clever ${name}\` command reference`];

  const rootDefinition = Array.isArray(command) ? command[0] : command;
  const experimentalNote = getExperimentalNote(rootDefinition);
  if (experimentalNote) {
    parts.push(experimentalNote);
  }

  const subCommands = getSubCommands(name, command);
  for (const sc of subCommands) {
    const heading = getSubCommandHeading(sc.path, sc.definition);
    const subCommandNodes = ast ? getNodesBetweenH2(ast.children, heading) : [];
    parts.push(getSubCommandMarkdown(sc.path, sc.definition, subCommandNodes));
  }

  return parts.join('\n\n');
}

/**
 * Recursively retrieves all subcommands of a root command.
 * @param {string} name
 * @param {unknown} command
 * @param {string[]} [parentPath=[]]
 * @return {unknown[]}
 */
function getSubCommands(name, command, parentPath = []) {
  const result = [];
  const currentPath = [...parentPath, name];

  if (Array.isArray(command)) {
    const [definition, subCommandsMap] = command;
    result.push({ path: currentPath, definition });

    if (subCommandsMap) {
      for (const [subName, subCommand] of Object.entries(subCommandsMap)) {
        result.push(...getSubCommands(subName, subCommand, currentPath));
      }
    }
  } else {
    result.push({ path: currentPath, definition: command });
  }

  return result;
}

/**
 * Generates the H2 heading for a subcommand.
 * @param {string[]} commandPath
 * @param {CommandDefinition} definition
 * @return {string}
 */
export function getSubCommandHeading(commandPath, definition) {
  return `## ➡️ \`clever ${commandPath.join(' ')}\` <kbd>Since ${definition.since}</kbd>`;
}

/**
 * Generates the full markdown section for a subcommand (heading, description, usage, args, options, custom sections).
 * @param {string[]} path
 * @param {CommandDefinition} definition
 * @param {MdastRootContent[]} subCommandNodes
 * @return {string}
 */
export function getSubCommandMarkdown(path, definition, subCommandNodes) {
  const parts = [getSubCommandHeading(path, definition)];

  parts.push(definition.description);
  parts.push(getCommandUsageMarkdown(path, definition));

  const argsMarkdown = getCommandArgumentsMarkdown(definition.args);
  if (argsMarkdown) {
    parts.push(argsMarkdown);
  }

  const optionsMarkdown = getCommandOptionsMarkdown(definition.options);
  if (optionsMarkdown) {
    parts.push(optionsMarkdown);
  }

  // Find custom H3 sections (not Arguments or Options)
  const customSections = getCustomH3Sections(subCommandNodes);
  for (const section of customSections) {
    parts.push(stringifyMarkdown({ type: 'root', children: section.nodes }));
  }

  return parts.join('\n\n');
}


/**
 * Generates the Arguments section for a command.
 * @param {ArgumentDefinition[]} [args]
 * @return {string}
 */
function getCommandArgumentsMarkdown(args) {
  if (!args || args.length === 0) {
    return '';
  }

  const rows = args.map((arg) => {
    const name = `\`${arg.placeholder}\``;
    const description = getArgumentDescription(arg);
    return `|${name}|${description}|`;
  });

  return dedent`
    ### 📥 Arguments

    |Name|Description|
    |---|---|
    ${rows.join('\n')}
  `;
}

/**
 * Generates an argument's description, with (optional) suffix if needed.
 * @param {ArgumentDefinition} arg
 * @return {string}
 */
function getArgumentDescription(arg) {
  const description = escapeTableCell(arg.description);
  if (!isRequired(arg.schema)) {
    return `${description} *(optional)*`;
  }
  return description;
}

/**
 * Generates the Options section for a command.
 * @param {Record<string, OptionDefinition>} [options]
 * @return {string}
 */
function getCommandOptionsMarkdown(options) {
  if (!options || Object.keys(options).length === 0) {
    return '';
  }

  // Filter out global options and sort: required first, then alphabetically
  const entries = Object.entries(options)
    .filter(([name]) => !GLOBAL_OPTIONS.has(name))
    .sort(([nameA, optA], [nameB, optB]) => {
      const aRequired = isRequired(optA.schema);
      const bRequired = isRequired(optB.schema);
      if (aRequired && !bRequired) return -1;
      if (!aRequired && bRequired) return 1;
      return nameA.localeCompare(nameB);
    });

  if (entries.length === 0) {
    return '';
  }

  const rows = entries.map(([name, option]) => {
    const aliases = getOptionAliases(name, option, isBoolean);
    const description = getOptionDescription(option);
    return `|${aliases}|${description}|`;
  });

  return dedent`
    ### ⚙️ Options

    |Name|Description|
    |---|---|
    ${rows.join('\n')}
  `;
}

/**
 * Generates an option's description, with (required) or (default) suffix.
 * @param {OptionDefinition} option
 * @return {string}
 */
function getOptionDescription(option) {
  const description = escapeTableCell(option.description);
  if (isRequired(option.schema)) {
    return `${description} **(required)**`;
  }
  const defaultValue = getDefault(option.schema);
  if (defaultValue !== null && defaultValue !== undefined && defaultValue !== '' && defaultValue !== false) {
    return `${description} (default: ${formatDefault(defaultValue)})`;
  }
  return description;
}

/**
 * Formats a default value for display in markdown.
 * @param {*} value
 * @return {string}
 */
function formatDefault(value) {
  if (value === null || value === undefined) return 'none';
  if (value === '') return '`""`';
  if (typeof value === 'boolean') return `\`${String(value)}\``;
  return `\`${escapeTableCell(String(value))}\``;
}

/**
 * Extracts custom H3 sections (not Arguments or Options) from subcommand nodes.
 * @param {MdastRootContent[]} nodes
 * @return {Array<{heading: any, nodes: MdastRootContent[]}>}
 */
function getCustomH3Sections(nodes) {
  const sections = [];
  let currentSection = null;

  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 3) {
      const text = stringifyMarkdown(node);
      const isGenerated = text.includes('Arguments') || text.includes('Options');

      if (currentSection && !currentSection.isGenerated) {
        sections.push({ heading: currentSection.heading, nodes: currentSection.nodes });
      }

      currentSection = {
        heading: node,
        nodes: [node],
        isGenerated,
      };
    } else if (currentSection) {
      currentSection.nodes.push(node);
    }
  }

  // Don't forget the last section
  if (currentSection && !currentSection.isGenerated) {
    sections.push({ heading: currentSection.heading, nodes: currentSection.nodes });
  }

  return sections;
}
