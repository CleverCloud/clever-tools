#!/usr/bin/env node
//
// Generate and update markdown documentation for CLI commands.
//
// This script reads command definitions from src/commands/global.commands.js
// and generates/updates markdown documentation files for each command family.
//
// Generated sections are detected by heading levels:
// - ## command-name    -> command heading (regenerated)
// - First paragraph    -> description (regenerated)
// - First code block   -> usage (regenerated)
// - ### Arguments      -> arguments table (regenerated)
// - ### Options        -> options table (regenerated)
// - Other content      -> preserved (human-written)
//
// USAGE:
//   generate-cli-markdown-docs.js [options] [command]
//
// OPTIONS:
//   --check    Validate docs are up-to-date without writing (exit 1 if outdated)
//   --help     Show this usage information
//
// ARGUMENTS:
//   command    Optional: generate docs for a specific command only (e.g., "addon")
//
// EXAMPLES:
//   generate-cli-markdown-docs.js              # Generate/update all command docs
//   generate-cli-markdown-docs.js addon        # Generate/update only addon docs
//   generate-cli-markdown-docs.js --check      # Check if all docs are up-to-date
//   generate-cli-markdown-docs.js --check env  # Check if env docs are up-to-date

import fs from 'node:fs/promises';
import path from 'node:path';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { globalCommands } from '../src/commands2/global.commands.js';
import { styleText } from '../src/lib/style-text.js';
import {
  escapeTableCell,
  flattenCommands,
  formatArgDescription,
  formatOptionDescription,
  getSchemaDefault,
  groupByRoot,
  isBooleanFlag,
  isSchemaOptional,
  isSchemaRequired,
} from './lib/command-helpers.js';
import { ArgumentError, runCommand } from './lib/command.js';

const COMMANDS_DIR = path.resolve(import.meta.dirname, '../src/commands2');

// Global options that should be excluded from the options table
const GLOBAL_OPTIONS = new Set(['color', 'update-notifier', 'verbose']);

/**
 * @typedef {Object} CommandDef
 * @property {string} name
 * @property {string} description
 * @property {boolean} experimental
 * @property {string|null} featureFlag
 * @property {Object<string, OptionDef>} options
 * @property {ArgDef[]} args
 */

/**
 * @typedef {Object} OptionDef
 * @property {string} name
 * @property {string} description
 * @property {'option'|'flag'} type
 * @property {string|null} metavar
 * @property {string[]|null} aliases
 * @property {*} default
 * @property {boolean|null} required
 */

/**
 * @typedef {Object} ArgDef
 * @property {string} name
 * @property {string} description
 * @property {*} default
 * @property {boolean|null} required
 */

/**
 * @typedef {import('./lib/command-helpers.js').FlatCommand} FlatCommand
 */

/**
 * Formats name with aliases for display (e.g., `-l, --link <string>`).
 * @param {string} name - The full option name
 * @param {string[]|null} aliases
 * @param {string} type - 'option' or 'flag'
 * @param {string|null} metavar - The metavar for the option value
 * @returns {string}
 */
function formatNameWithAliases(name, aliases, type, metavar) {
  const parts = [];

  // Add aliases first (short form)
  if (aliases && aliases.length > 0) {
    for (const alias of aliases) {
      parts.push(`-${alias}`);
    }
  }

  // Add main option name
  parts.push(`--${name}`);

  // Build the formatted string
  let formatted = parts.map((p) => `\`${p}\``).join(', ');

  // Add metavar for non-flag options
  if (type !== 'flag') {
    const escapedMetavar = metavar ? escapeTableCell(metavar) : name;
    formatted += ` \`<${escapedMetavar}>\``;
  }

  return formatted;
}

/**
 * Generates the Arguments table markdown.
 * @param {ArgDef[]} args
 * @returns {string|null}
 */
function generateArgsTable(args) {
  if (!args || args.length === 0) {
    return null;
  }

  const lines = ['### 📥 Arguments', '', '| Name | Description |', '|------|-------------|'];

  for (const arg of args) {
    const name = `\`${escapeTableCell(arg.placeholder)}\``;
    const isOptional = isSchemaOptional(arg.schema);
    const description = formatArgDescription(arg.description, isOptional);
    lines.push(`| ${name} | ${description} |`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generates the Options table markdown.
 * @param {Object<string, OptionDef>} options
 * @returns {string|null}
 */
function generateOptionsTable(options) {
  if (!options) return null;

  // Filter out global options - now name comes from object key
  const optionEntries = Object.entries(options).filter(([name]) => !GLOBAL_OPTIONS.has(name));

  if (optionEntries.length === 0) {
    return null;
  }

  // Sort: required options first, then others
  // Required = schema has no default and no optional wrapper
  optionEntries.sort(([, a], [, b]) => {
    const aRequired = isSchemaRequired(a.schema);
    const bRequired = isSchemaRequired(b.schema);
    if (aRequired && !bRequired) return -1;
    if (!aRequired && bRequired) return 1;
    return 0;
  });

  const lines = ['### ⚙️ Options', '', '| Name | Description |', '|------|-------------|'];

  for (const [name, option] of optionEntries) {
    const type = isBooleanFlag(option) ? 'flag' : 'option';
    const formattedName = formatNameWithAliases(name, option.aliases, type, option.placeholder);
    const defaultValue = getSchemaDefault(option.schema);
    // Required = schema has no default and no optional wrapper (detected from Zod schema)
    const isRequired = isSchemaRequired(option.schema);
    const description = formatOptionDescription(option.description, defaultValue, isRequired);

    lines.push(`| ${formattedName} | ${description} |`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generates the "since" line with version.
 * @param {string|undefined} since - Version string (semver)
 * @returns {string|null}
 */
function generateSinceLine(since) {
  if (!since) {
    return null;
  }

  return `<kbd>Since ${since}</kbd>`;
}

/**
 * Generates the bash usage blockquote.
 * @param {FlatCommand} cmd
 * @returns {string}
 */
function generateUsageBlock(cmd) {
  const parts = [`clever ${cmd.path}`];

  // Check if there are any options
  const optionEntries = Object.entries(cmd.command.options || {});

  // Find required options (schema has no default and no optional wrapper)
  const requiredOptions = optionEntries.filter(([, option]) => isSchemaRequired(option.schema));
  const hasOptionalOptions = optionEntries.length > requiredOptions.length;

  // Add required options explicitly in the usage line
  for (const [name, option] of requiredOptions) {
    const metavar = option.placeholder ?? name;
    parts.push(`--${name} <${metavar}>`);
  }

  // Add all positional arguments
  if (cmd.command.args && cmd.command.args.length > 0) {
    for (const arg of cmd.command.args) {
      const isOptional = isSchemaOptional(arg.schema);
      const placeholder = arg.placeholder;
      parts.push(isOptional ? `[${placeholder}]` : `<${placeholder}>`);
    }
  }

  // Add [options] at the end only if there are optional options
  if (hasOptionalOptions) {
    parts.push('[options]');
  }

  const lines = [];
  lines.push('```bash');
  lines.push(parts.join(' '));
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

/**
 * Generates markdown content for a single command section.
 * @param {FlatCommand} cmd
 * @returns {{heading: string, description: string, since: string|null, usage: string, args: string|null, options: string|null, isExperimental: boolean}}
 */
function generateCommandSections(cmd) {
  const since = generateSinceLine(cmd.command.since);
  const headingParts = [`## ➡️ \`clever ${cmd.path}\``];
  if (since) {
    headingParts.push(since);
  }

  return {
    heading: headingParts.join(' '),
    description: cmd.command.description || '',
    usage: generateUsageBlock(cmd),
    args: generateArgsTable(cmd.command.args),
    options: generateOptionsTable(cmd.command.options),
    isExperimental: cmd.command.experimental === true || cmd.command.featureFlag != null,
  };
}

/**
 * Generates a new doc file from scratch.
 * @param {string} rootName
 * @param {FlatCommand[]} commands
 * @returns {Promise<string>}
 */
async function generateNewDocFile(rootName, commands) {
  const lines = [`# 📖 \`clever ${rootName}\` command reference`, ''];

  for (const cmd of commands) {
    const sections = generateCommandSections(cmd);

    // Command heading
    lines.push(sections.heading);
    lines.push('');

    // Description
    lines.push(sections.description);
    lines.push('');

    // Usage block
    lines.push(sections.usage.trim());
    lines.push('');

    // Add experimental note if applicable
    if (sections.isExperimental) {
      lines.push('> 🧪 **Experimental**: This command may change or be removed in future versions.');
      lines.push('');
    }

    // Arguments section (only if there are args)
    if (sections.args !== null) {
      lines.push(sections.args.trim());
      lines.push('');
    }

    // Options section (only if there are options)
    if (sections.options !== null) {
      lines.push(sections.options.trim());
      lines.push('');
    }
  }

  // Normalize through remark to ensure stable output
  const rawContent = lines.join('\n');
  const ast = await parseMarkdown(rawContent);
  return serializeMarkdown(ast);
}

/**
 * Parses markdown content and returns the AST.
 * @param {string} content
 * @returns {Promise<import('mdast').Root>}
 */
async function parseMarkdown(content) {
  const processor = unified().use(remarkParse);
  return processor.parse(content);
}

/**
 * Serializes an AST back to markdown string.
 * @param {import('mdast').Root} ast
 * @returns {Promise<string>}
 */
async function serializeMarkdown(ast) {
  const processor = unified().use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    fence: '`',
    fences: true,
    listItemIndent: 'one',
  });
  return processor.stringify(ast);
}

/**
 * Gets text content from an AST node.
 * @param {import('mdast').RootContent} node
 * @returns {string}
 */
function getNodeText(node) {
  if (node.type === 'text') return node.value;
  if (node.type === 'inlineCode') return node.value;
  if ('children' in node) {
    return node.children.map(getNodeText).join('');
  }
  return '';
}

/**
 * Checks if a node is a heading with specific depth and text.
 * @param {import('mdast').RootContent} node
 * @param {number} depth
 * @param {string} [text]
 * @returns {boolean}
 */
function isHeading(node, depth, text) {
  if (node.type !== 'heading' || node.depth !== depth) return false;
  if (text === undefined) return true;
  return getNodeText(node) === text;
}

/**
 * Checks if a node is a heading containing specific text (supports emoji prefixes).
 * @param {import('mdast').RootContent} node
 * @param {number} depth
 * @param {string} text
 * @returns {boolean}
 */
function isHeadingContaining(node, depth, text) {
  if (node.type !== 'heading' || node.depth !== depth) return false;
  return getNodeText(node).includes(text);
}

/**
 * Checks if a node is a code block with bash language.
 * @param {import('mdast').RootContent} node
 * @returns {boolean}
 */
function isBashCodeBlock(node) {
  return node.type === 'code' && node.lang === 'bash';
}

/**
 * Checks if a node is an "Experimental" blockquote.
 * @param {import('mdast').RootContent} node
 * @returns {boolean}
 */
function isExperimentalNote(node) {
  if (node.type !== 'blockquote') return false;
  const text = getNodeText(node);
  return text.includes('Experimental');
}

/**
 * Checks if a node is a "since" line (contains 📦 or 📅).
 * @param {import('mdast').RootContent} node
 * @returns {boolean}
 */
function isSinceLine(node) {
  if (node.type !== 'paragraph') return false;
  const text = getNodeText(node);
  // Support old format (📦/📅 emojis) and new format (Since ...)
  return text.includes('📦') || text.includes('📅') || text.includes('Since ');
}

/**
 * Parses a markdown string into AST nodes.
 * @param {string} markdown
 * @returns {Promise<import('mdast').RootContent[]>}
 */
async function parseToNodes(markdown) {
  const ast = await parseMarkdown(markdown);
  return ast.children;
}

/**
 * Finds command section boundaries in the AST.
 * Returns the indices where each command section starts.
 * @param {import('mdast').RootContent[]} children
 * @returns {Map<string, {start: number, end: number}>}
 */
function findCommandBoundaries(children) {
  const boundaries = new Map();
  let currentCmd = null;
  let currentStart = -1;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Check for ## heading (command start)
    if (isHeading(node, 2)) {
      // Close previous command section
      if (currentCmd !== null) {
        boundaries.set(currentCmd, { start: currentStart, end: i });
      }

      // Extract command path from heading text
      // Heading format: "➡️ `clever <path>`" -> after getNodeText: "➡️ clever <path>"
      let cmdText = getNodeText(node);
      // Strip everything up to and including "clever " (handles emoji prefix + "clever ")
      const cleverIndex = cmdText.indexOf('clever ');
      if (cleverIndex !== -1) {
        cmdText = cmdText.slice(cleverIndex + 7);
      }
      currentCmd = cmdText;
      currentStart = i;
    }
  }

  // Close last command section
  if (currentCmd !== null) {
    boundaries.set(currentCmd, { start: currentStart, end: children.length });
  }

  return boundaries;
}

/**
 * Finds the indices of generated content within a command section.
 * @param {import('mdast').RootContent[]} children
 * @param {number} start - Start index of command section
 * @param {number} end - End index of command section
 * @returns {{heading: number, description: number|null, usage: number|null, args: {start: number, end: number}|null, options: {start: number, end: number}|null, customContentStart: number}}
 */
function findGeneratedSections(children, start, end) {
  const result = {
    heading: start,
    description: null,
    usage: null,
    args: null,
    options: null,
    customContentStart: end,
  };

  let i = start + 1;

  // Find description (first paragraph after heading)
  while (i < end && children[i].type !== 'paragraph') {
    i++;
  }
  if (i < end && children[i].type === 'paragraph') {
    result.description = i;
    i++;
  }

  // Find usage (first bash code block)
  while (i < end && !isBashCodeBlock(children[i])) {
    i++;
  }
  if (i < end && isBashCodeBlock(children[i])) {
    result.usage = i;
    i++;
  }

  // Find ### Arguments and ### Options sections
  while (i < end) {
    const node = children[i];

    if (isHeadingContaining(node, 3, 'Arguments')) {
      const argsStart = i;
      i++;
      // Find end of arguments section (next ### or ## or end)
      while (i < end && !isHeading(children[i], 3) && !isHeading(children[i], 2)) {
        i++;
      }
      result.args = { start: argsStart, end: i };
      continue;
    }

    if (isHeadingContaining(node, 3, 'Options')) {
      const optionsStart = i;
      i++;
      // Find end of options section (next ### or ## or end)
      while (i < end && !isHeading(children[i], 3) && !isHeading(children[i], 2)) {
        i++;
      }
      result.options = { start: optionsStart, end: i };
      continue;
    }

    // If we hit any other ### heading or content after generated sections, it's custom content
    if (result.options !== null || result.args !== null || result.usage !== null) {
      result.customContentStart = i;
      break;
    }

    i++;
  }

  // If no custom content found, set it to end
  if (result.customContentStart === end) {
    // Check if there's content after the last generated section
    const lastGenerated = Math.max(
      result.options?.end ?? 0,
      result.args?.end ?? 0,
      result.usage !== null ? result.usage + 1 : 0,
      result.description !== null ? result.description + 1 : 0,
    );
    if (lastGenerated < end) {
      result.customContentStart = lastGenerated;
    }
  }

  return result;
}

/**
 * Updates an existing doc file with new generated content.
 * Preserves custom content in its original position.
 * @param {string} existingContent
 * @param {FlatCommand[]} commands
 * @returns {Promise<string>}
 */
async function updateDocFile(existingContent, commands) {
  const ast = await parseMarkdown(existingContent);
  const boundaries = findCommandBoundaries(ast.children);

  // Build command lookup map
  const commandMap = new Map();
  for (const cmd of commands) {
    commandMap.set(cmd.path, cmd);
  }

  // Process each command section in place
  const newChildren = [];

  // Get root name from first command
  const rootName = commands[0]?.path.split(' ')[0] || '';

  // Replace the # heading
  const h1Nodes = await parseToNodes(`# 📖 \`clever ${rootName}\` command reference`);
  newChildren.push(...h1Nodes);

  for (const cmd of commands) {
    const sections = generateCommandSections(cmd);
    const boundary = boundaries.get(cmd.path);

    if (!boundary) {
      // New command not in existing file, generate from scratch
      const headingNodes = await parseToNodes(sections.heading);
      newChildren.push(...headingNodes);

      const descNodes = await parseToNodes(sections.description);
      newChildren.push(...descNodes);

      const usageNodes = await parseToNodes(sections.usage);
      newChildren.push(...usageNodes);

      if (sections.isExperimental) {
        const expNodes = await parseToNodes(
          '> 🧪 **Experimental**: This command may change or be removed in future versions.\n',
        );
        newChildren.push(...expNodes);
      }

      if (sections.args !== null) {
        const argsNodes = await parseToNodes(sections.args);
        newChildren.push(...argsNodes);
      }

      if (sections.options !== null) {
        const optionsNodes = await parseToNodes(sections.options);
        newChildren.push(...optionsNodes);
      }
      continue;
    }

    // Walk through existing content and replace generated sections in place
    let i = boundary.start;

    // 1. Replace ## heading
    const headingNodes = await parseToNodes(sections.heading);
    newChildren.push(...headingNodes);
    i++; // Skip old heading

    // 2. Replace description (first paragraph after heading, but not a since line)
    while (i < boundary.end && ast.children[i].type !== 'paragraph') {
      i++;
    }
    if (i < boundary.end && ast.children[i].type === 'paragraph' && !isSinceLine(ast.children[i])) {
      const descNodes = await parseToNodes(sections.description);
      newChildren.push(...descNodes);
      i++; // Skip old description
    }

    // 3. Skip old since line if present (now included in heading)
    if (i < boundary.end && isSinceLine(ast.children[i])) {
      i++;
    }

    // 4. Replace usage (first bash code block)
    while (i < boundary.end && !isBashCodeBlock(ast.children[i])) {
      // Copy any content between since and usage (shouldn't normally exist)
      newChildren.push(ast.children[i]);
      i++;
    }
    if (i < boundary.end && isBashCodeBlock(ast.children[i])) {
      const usageNodes = await parseToNodes(sections.usage);
      newChildren.push(...usageNodes);
      i++; // Skip old usage
    }

    // 5. Handle experimental note
    // Skip old experimental note if present
    if (i < boundary.end && isExperimentalNote(ast.children[i])) {
      i++;
    }
    // Add new experimental note if needed
    if (sections.isExperimental) {
      const expNodes = await parseToNodes(
        '> 🧪 **Experimental**: This command may change or be removed in future versions.\n',
      );
      newChildren.push(...expNodes);
    }

    // 6. Process remaining content, replacing Arguments/Options in place, preserving custom sections
    let argsInserted = false;
    let optionsInserted = false;

    while (i < boundary.end) {
      const node = ast.children[i];

      if (isHeadingContaining(node, 3, 'Arguments')) {
        // Replace Arguments section
        if (sections.args !== null) {
          const argsNodes = await parseToNodes(sections.args);
          newChildren.push(...argsNodes);
          argsInserted = true;
        }
        // Skip old Arguments section content
        i++;
        while (i < boundary.end && !isHeading(ast.children[i], 3) && !isHeading(ast.children[i], 2)) {
          i++;
        }
        continue;
      }

      if (isHeadingContaining(node, 3, 'Options')) {
        // Replace Options section
        if (sections.options !== null) {
          const optionsNodes = await parseToNodes(sections.options);
          newChildren.push(...optionsNodes);
          optionsInserted = true;
        }
        // Skip old Options section content
        i++;
        while (i < boundary.end && !isHeading(ast.children[i], 3) && !isHeading(ast.children[i], 2)) {
          i++;
        }
        continue;
      }

      // Custom content - preserve in its exact position
      newChildren.push(node);
      i++;
    }

    // Insert Arguments/Options at end if they didn't exist in the original file
    if (!argsInserted && sections.args !== null) {
      const argsNodes = await parseToNodes(sections.args);
      newChildren.push(...argsNodes);
    }
    if (!optionsInserted && sections.options !== null) {
      const optionsNodes = await parseToNodes(sections.options);
      newChildren.push(...optionsNodes);
    }
  }

  ast.children = newChildren;
  return serializeMarkdown(ast);
}

/**
 * Gets the doc file path for a command.
 * @param {string} rootName
 * @returns {string}
 */
function getDocPath(rootName) {
  return path.join(COMMANDS_DIR, rootName, `${rootName}.docs.md`);
}

/**
 * Checks if a directory exists.
 * @param {string} dirPath
 * @returns {Promise<boolean>}
 */
async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a file uses the new marker-free structure.
 * @param {string} content
 * @returns {boolean}
 */
function hasMarkerFreeStructure(content) {
  // Old structure has HTML comment markers
  return !content.includes('<!-- generate-cli-markdown-docs:');
}

const README_PATH = path.join(COMMANDS_DIR, 'README.md');

/**
 * Generates the README.md content linking to all command docs.
 * @param {Map<string, FlatCommand[]>} grouped - Commands grouped by root name
 * @returns {string}
 */
async function generateReadme(grouped) {
  const lines = [
    '# clever-tools reference',
    '',
    'This directory contains the documentation for all `clever` CLI commands.',
    '',
    '## 🚩 Global options',
    '',
    'These options are available for all commands:',
    '',
    '| Name | Description |',
    '|------|-------------|',
    '| `--color`, `--no-color` | Enable or disable colored output |',
    '| `-v`, `--verbose` | Enable verbose output |',
    '| `--update-notifier`, `--no-update-notifier` | Enable or disable the update notifier |',
    '',
    '## ➡️ Commands',
    '',
    '| Command | Description |',
    '|---------|-------------|',
  ];

  // Sort roots alphabetically
  const sortedRoots = [...grouped.keys()].sort();

  for (const rootName of sortedRoots) {
    const commands = grouped.get(rootName);
    // The first command in the group is the root command
    const rootCommand = commands[0];
    const description = escapeTableCell(rootCommand.command.description || '');
    const docPath = `./${rootName}/${rootName}.docs.md`;

    lines.push(`| [\`clever ${rootName}\`](${docPath}) | ${description} |`);
  }

  lines.push('');

  // Normalize through remark
  const rawContent = lines.join('\n');
  const ast = await parseMarkdown(rawContent);
  return serializeMarkdown(ast);
}

/**
 * Main function to generate/update docs.
 * @param {Object} options
 * @param {boolean} options.check - Check mode (don't write, exit 1 if outdated)
 * @param {string|null} options.command - Specific command to process (null for all)
 */
async function generateDocs({ check, command }) {
  const allCommands = flattenCommands(globalCommands);
  const grouped = groupByRoot(allCommands);

  // Filter to specific command if requested
  const rootsToProcess = command ? [command] : [...grouped.keys()];

  // Validate requested command exists
  if (command && !grouped.has(command)) {
    throw new ArgumentError(`Unknown command: "${command}". Available commands: ${[...grouped.keys()].join(', ')}`);
  }

  const outdated = [];
  const updated = [];
  const created = [];
  const skipped = [];

  for (const rootName of rootsToProcess) {
    const commands = grouped.get(rootName);
    const docPath = getDocPath(rootName);
    const dirPath = path.dirname(docPath);

    // Check if command directory exists
    if (!(await dirExists(dirPath))) {
      skipped.push({ rootName, reason: 'directory not found' });
      continue;
    }

    const exists = await fileExists(docPath);
    const existingContent = exists ? await fs.readFile(docPath, 'utf-8') : null;

    let newContent;
    if (exists && hasMarkerFreeStructure(existingContent)) {
      // Update existing file with marker-free structure
      newContent = await updateDocFile(existingContent, commands);
    } else {
      // Generate new file (or regenerate from old marker-based structure)
      newContent = await generateNewDocFile(rootName, commands);
    }

    // Check if content changed
    if (existingContent === newContent) {
      // No changes needed
      continue;
    }

    if (check) {
      outdated.push(docPath);
    } else {
      await fs.writeFile(docPath, newContent);
      if (exists) {
        updated.push(docPath);
      } else {
        created.push(docPath);
      }
    }
  }

  // Generate/update README.md (only when processing all commands)
  if (!command) {
    const readmeContent = await generateReadme(grouped);
    const readmeExists = await fileExists(README_PATH);
    const existingReadme = readmeExists ? await fs.readFile(README_PATH, 'utf-8') : null;

    if (existingReadme !== readmeContent) {
      if (check) {
        outdated.push(README_PATH);
      } else {
        await fs.writeFile(README_PATH, readmeContent);
        if (readmeExists) {
          updated.push(README_PATH);
        } else {
          created.push(README_PATH);
        }
      }
    }
  }

  // Output results
  if (check) {
    if (outdated.length > 0) {
      console.log(styleText('red', 'The following documentation files are outdated:'));
      for (const file of outdated) {
        console.log(`  - ${path.relative(process.cwd(), file)}`);
      }
      console.log(`\nRun ${styleText('cyan', 'node scripts/generate-cli-markdown-docs.js')} to update them.`);
      process.exit(1);
    } else {
      console.log(styleText('green', 'All documentation files are up-to-date.'));
    }
  } else {
    if (created.length > 0) {
      console.log(styleText('green', `Created ${created.length} file(s):`));
      for (const file of created) {
        console.log(`  + ${path.relative(process.cwd(), file)}`);
      }
    }

    if (updated.length > 0) {
      console.log(styleText('yellow', `Updated ${updated.length} file(s):`));
      for (const file of updated) {
        console.log(`  ~ ${path.relative(process.cwd(), file)}`);
      }
    }

    if (skipped.length > 0) {
      console.log(styleText('dim', `Skipped ${skipped.length} command(s):`));
      for (const { rootName, reason } of skipped) {
        console.log(`  - ${rootName} (${reason})`);
      }
    }

    if (created.length === 0 && updated.length === 0) {
      console.log(styleText('green', 'All documentation files are up-to-date.'));
    }
  }
}

// Main entry point
runCommand(async () => {
  const args = process.argv.slice(2);

  // Parse arguments
  const check = args.includes('--check');
  const filteredArgs = args.filter((arg) => !arg.startsWith('--'));
  const command = filteredArgs[0] || null;

  await generateDocs({ check, command });
});
