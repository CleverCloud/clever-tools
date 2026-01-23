import dedent from 'dedent';
import { getCommandInfo } from '../../src/lib/get-command-info.js';
import { formatCodeList, parseMarkdown } from './markdown.js';

/**
 * @typedef {import('@clevercloud/client/cc-api-commands/product/product.types.js').ProductRuntime} ProductRuntime
 * @typedef {import('@clevercloud/client/cc-api-commands/product/product.types.js').ProductAddon} ProductAddon
 * @typedef {import('@clevercloud/client/cc-api-commands/zone/zone.types.js').Zone} Zone
 * @typedef {import('../../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('zod').ZodType} ZodType
 */

/**
 * @typedef {object} LlmsDocumentationData
 * @property {string} rawSetupContent - Raw markdown content for setup instructions
 * @property {ProductRuntime[]} instances - Application instances from API
 * @property {Zone[]} deploymentZones - Available deployment zones from API
 * @property {ProductAddon[]} addonProviders - Add-on providers from API
 */

/**
 * Generates LLM-optimized documentation for all commands.
 * @param {Array<[string, unknown]>} commands - Command entries from Object.entries(globalCommands)
 * @param {LlmsDocumentationData} data - Data for generating documentation
 * @return {string} Generated markdown documentation
 */
export function getLlmsDocumentation(commands, { rawSetupContent, instances, deploymentZones, addonProviders }) {
  const parts = [
    dedent`
      This document is automatically generated from Clever Tools and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

      To use Clever Tools, you need:
      - A Clever Cloud account, create one at https://console.clever-cloud.com/
      - The Clever Tools CLI installed, see installation instructions below

      In CI/CD pipelines or for one-off usage, you can use it through \`npx\` or \`npm exec\`:

      \`\`\`bash
      # Set/Export CLEVER_TOKEN and CLEVER_SECRET to login with a given account
      # --yes is used to skip the interactive prompts
      npx --yes clever-tools@latest version
      \`\`\`

      You'll also need:

      - To be logged in with \`clever login\` command (you'll get a \`$HOME/.config/clever-cloud/clever-tools.json\` file)
      - git installed on your system and properly configured
      - A local git repository with at least one commit to deploy your application

      To control an application with Clever Tools, it must be linked to a local directory (a \`.clever.json\` file is present, containing its \`app_id\`, \`name\`, \`local alias\`, \`org_id\`, \`deploy_url\`, \`git_ssh_url\`). You can target an application on most commands with \`--app app_id_or_name\` option.
    `,
    getSetupContent(rawSetupContent),
    getApplicationsSection(instances, deploymentZones),
    getAddonsSection(addonProviders),
    getCommandsSection(commands),
    dedent`
      ## Clever Cloud complete documentation

      For more comprehensive information about Clever Cloud, read the complete documentation: https://www.clever-cloud.com/developers/doc/
      Clever Cloud complete documentation is available in a LLM-optimized format: https://www.clever-cloud.com/developers/llms.txt
    `,
  ];

  return parts.join('\n\n');
}

/**
 * Cleans setup documentation for inclusion in LLM docs.
 * - Increases heading levels by 1
 * - Removes TOC (lists with links to /docs/setup-systems.md#)
 * @param {string} markdown
 * @return {string}
 */
function getSetupContent(markdown) {
  // Increase heading levels with regex (# → ##, ## → ###, etc.)
  let result = markdown.replace(/^(#+)/gm, '#$1');

  // Parse to find TOC lists positions, then remove them from raw string
  const ast = parseMarkdown(result);
  const tocRanges = ast.children
    .filter((node) => {
      if (node.type !== 'list' || !node.position) return false;
      const listText = result.slice(node.position.start.offset, node.position.end.offset);
      return listText.includes('/docs/setup-systems.md#');
    })
    .map((node) => ({ start: node.position?.start.offset ?? 0, end: node.position?.end.offset ?? 0 }));

  // Remove TOC ranges from end to start to preserve offsets
  for (const range of tocRanges.reverse()) {
    result = result.slice(0, range.start) + result.slice(range.end);
  }

  return result.trim();
}

/**
 * Generates the "Application types and zones" section content.
 * @param {ProductRuntime[]} instances
 * @param {Zone[]} deploymentZones
 * @return {string}
 */
function getApplicationsSection(instances, deploymentZones) {
  // Application types (sorted alphabetically)
  const applicationTypes = instances.map((instance) => instance.variant.slug).sort();

  // List all flavors
  const allFlavors = instances
    .flatMap((instance) => instance.flavors)
    // Sort by size, sort of...
    .sort((a, b) => a.mem * a.cpus - b.mem * b.cpus)
    .map((flavor) => flavor.name);
  const uniqueFlavors = Array.from(new Set(allFlavors));

  // Find flavor exceptions (flavors not available for certain instance types)
  const flavorExceptionLines = [];
  for (const flavor of uniqueFlavors) {
    const missing = instances
      .filter((instance) => !instance.flavors?.some((f) => f.name === flavor))
      .map((instance) => instance.variant.slug)
      .sort();
    if (missing.length > 0) {
      flavorExceptionLines.push(`Flavor \`${flavor}\` is not available for: ${formatCodeList(missing)}`);
    }
  }

  // Deployment zones (sorted with 'par' first)
  const zones = deploymentZones.map((zone) => zone.name).sort(sortZones);

  return dedent`
    ## Application types and zones

    You can deploy applications on Clever Cloud with the following runtimes type: ${formatCodeList(applicationTypes)}

    Available flavors: ${formatCodeList(uniqueFlavors)}

    ${flavorExceptionLines.join('\n')}

    Applications deployment zones (region): ${formatCodeList(zones)}
  `;
}

/**
 * Comparator to sort zones with 'par' first, then alphabetically.
 * @param {string} a
 * @param {string} b
 * @return {number}
 */
function sortZones(a, b) {
  if (a.startsWith('par') !== b.startsWith('par')) {
    return a.startsWith('par') ? -1 : 1;
  }
  return a.localeCompare(b);
}

/**
 * Generates the "Add-on providers" section content.
 * @param {ProductAddon[]} addonProviders
 * @return {string}
 */
function getAddonsSection(addonProviders) {
  const providerListItems = addonProviders
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((provider) => {
      const lines = [];

      lines.push(`- \`${provider.id}\`:`);

      const plans =
        provider.plans
          // Sort by price (even if not 10%% reliable)
          ?.sort((a, b) => a.price - b.price)
          ?.map((plan) => plan.slug) ?? [];
      if (plans.length > 0) {
        lines.push(`  - plans: ${formatCodeList(plans)}`);
      }

      const zones = provider.zones?.sort(sortZones) ?? [];
      if (zones.length > 0) {
        lines.push(`  - zones: ${formatCodeList(zones)}`);
      }

      return lines.join('\n');
    });

  const parts = [
    '## Add-on providers, plans and zones (region)',
    ...providerListItems,
    'Default deployment zone is `par`, default plan is the lowest available.',
  ];

  return parts.join('\n\n');
}

/**
 * Generates documentation for all commands.
 * @param {Array<[string, unknown]>} commands - Command entries from Object.entries(globalCommands)
 * @return {string}
 */
function getCommandsSection(commands) {
  return flattenCommands(commands)
    .map(({ path, definition }) => {
      const headingLevel = path.length + 1;
      const heading = `${'#'.repeat(headingLevel)} ${path.join(' ')}`;
      return getCommandSection(heading, path, definition);
    })
    .join('\n\n');
}

/**
 * Flattens nested command structure into a sorted array of {path, definition}.
 * @param {Array<[string, unknown]> | Record<string, unknown>} commands
 * @param {string[]} [parentPath]
 * @return {Array<{path: string[], definition: CommandDefinition}>}
 */
function flattenCommands(commands, parentPath = []) {
  const entries = Array.isArray(commands) ? commands : Object.entries(commands);

  return entries
    .toSorted(([a], [b]) => a.localeCompare(b))
    .flatMap(([name, entry]) => {
      const path = [...parentPath, name];
      const definition = Array.isArray(entry) ? entry[0] : entry;
      const subcommands = Array.isArray(entry) && entry[1] ? flattenCommands(entry[1], path) : [];
      return [{ path, definition }, ...subcommands];
    });
}

/**
 * Generates markdown for a single command.
 * @param {string} heading
 * @param {string[]} path
 * @param {CommandDefinition} definition
 * @return {string}
 */
function getCommandSection(heading, path, definition) {
  const commandInfo = getCommandInfo(path, definition);

  const allRows = [];

  let argumentsRows;
  if (commandInfo.args) {
    argumentsRows = commandInfo.args.map((arg) => {
      let description = arg.description;
      if (arg.optional) description += ` ${arg.optional}`;
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
      if (opt.deprecated) description += ` ${opt.deprecated}`;
      if (opt.required) description += ` ${opt.required}`;
      if (opt.default) description += ` ${opt.default}`;
      return [aliases, description];
    });
    allRows.push(...optionsRows);
  }

  const firstColumnWith = Math.max(...allRows.map(([cell]) => cell.length));

  const parts = [heading];
  parts.push(`Description:** ${definition.description}`);

  parts.push(formatSection('Usage', [commandInfo.usage]));
  if (argumentsRows) {
    parts.push(formatSectionWithColumns('Arguments', argumentsRows, firstColumnWith));
  }
  if (optionsRows) {
    parts.push(formatSectionWithColumns('Options', optionsRows, firstColumnWith));
  }

  return parts.join('\n\n');
}

/**
 * @param {string} title
 * @param {Array<string>} lines
 */
function formatSection(title, lines) {
  return [`**${title}**`, ...lines].join('\n');
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
