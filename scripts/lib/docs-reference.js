import dedent from 'dedent';
import { getCommandInfo } from '../../src/lib/get-command-info.js';
import { escapeTableCell, formatCodeList, getNodesBetweenH2, stringifyMarkdown } from './markdown.js';

/**
 * @typedef {import('../../src/lib/define-option.types.js').OptionDefinition} OptionDefinition
 * @typedef {import('../../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').RootContent} MdastRootContent
 * @typedef {{ path: string[], definition: CommandDefinition }} SubCommandEntry
 */

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
 * @return {SubCommandEntry[]}
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
  const commandInfo = getCommandInfo(path, definition);

  const parts = [getSubCommandHeading(path, definition)];
  parts.push(definition.description);
  parts.push(`\`\`\`bash\n${commandInfo.usage}\n\`\`\``);

  if (commandInfo.args) {
    const rows = commandInfo.args.map((arg) => {
      let description = arg.description;
      if (arg.optional) description += ` *${arg.optional}*`;
      return `|\`${arg.name}\`|${escapeTableCell(description)}|`;
    });
    parts.push(dedent`
      ### 📥 Arguments

      |Name|Description|
      |---|---|
      ${rows.join('\n')}
    `);
  }

  if (commandInfo.options) {
    if (commandInfo.options.length > 0) {
      const rows = commandInfo.options.map((opt) => {
        const placeholder = opt.placeholder ? ` \`${opt.placeholder}\`` : '';
        const aliases = formatCodeList(opt.aliases) + placeholder;
        let description = opt.description;
        if (opt.deprecated) description += ` *${opt.deprecated}*`;
        if (opt.required) description += ` **${opt.required}**`;
        if (opt.default) description += ` ${opt.default}`;
        return `|${escapeTableCell(aliases)}|${escapeTableCell(description)}|`;
      });
      parts.push(dedent`
        ### ⚙️ Options

        |Name|Description|
        |---|---|
        ${rows.join('\n')}
      `);
    }
  }

  // Find custom H3 sections (not Arguments or Options)
  const customSections = getCustomH3Sections(subCommandNodes);
  for (const section of customSections) {
    parts.push(stringifyMarkdown({ type: 'root', children: section.nodes }));
  }

  return parts.join('\n\n');
}

/**
 * Extracts custom H3 sections (not Arguments or Options) from subcommand nodes.
 * @param {MdastRootContent[]} nodes
 * @return {Array<{heading: MdastRootContent, nodes: MdastRootContent[]}>}
 */
function getCustomH3Sections(nodes) {
  /** @type {Array<{heading: MdastRootContent, nodes: MdastRootContent[]}>} */
  const sections = [];
  /** @type {{ heading: MdastRootContent, nodes: MdastRootContent[], isGenerated: boolean } | null} */
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
