import dedent from 'dedent';
import { formatTable } from '../../src/format-table.js';
import { formatCodeList, getCommandUsageMarkdown } from './docs-common.js';
import { parseMarkdown } from './markdown.js';
import { getDefault, isBoolean, isRequired } from './schema-helpers.js';

/**
 * @typedef {object} LlmsDocumentationData
 * @property {string} version - CLI version string
 * @property {string} rawSetupContent - Raw markdown content for setup instructions
 * @property {Array<{ variant: { slug: string }, flavors?: Array<{ name: string }> }>} instances - Application instances from API
 * @property {Array<{ name: string }>} deploymentZones - Available deployment zones from API
 * @property {Array<{ id: string, plans?: Array<{ slug: string }>, regions?: string[] }>} addonProviders - Add-on providers from API
 */

/**
 * Generates LLM-optimized documentation for all commands.
 * @param {Array<[string, unknown]>} commands - Command entries from Object.entries(globalCommands)
 * @param {LlmsDocumentationData} data - Data for generating documentation
 * @return {string} Generated markdown documentation
 */
export function getLlmsDocumentation(
  commands,
  { version, rawSetupContent, instances, deploymentZones, addonProviders },
) {
  const parts = [
    dedent`
      This document is automatically generated from Clever Tools \`${version}\` and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

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
      if (node.type !== 'list') return false;
      const listText = result.slice(node.position.start.offset, node.position.end.offset);
      return listText.includes('/docs/setup-systems.md#');
    })
    .map((node) => ({ start: node.position.start.offset, end: node.position.end.offset }));

  // Remove TOC ranges from end to start to preserve offsets
  for (const range of tocRanges.reverse()) {
    result = result.slice(0, range.start) + result.slice(range.end);
  }

  return result.trim();
}

/**
 * Generates the "Application types and zones" section content.
 * @param {Array<{ variant: { slug: string }, flavors?: Array<{ name: string }> }>} instances
 * @param {Array<{ name: string }>} deploymentZones
 * @return {string}
 */
function getApplicationsSection(instances, deploymentZones) {
  // Application types (sorted alphabetically)
  const applicationTypes = instances.map((instance) => instance.variant.slug).sort();

  // List all flavors
  const allFlavors = instances
    .flatMap((instance) => instance.flavors)
    // Sort by size, sort of...
    .sort((a, b) => a.memory.value * a.cpus - b.memory.value * b.cpus)
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
 * @param {Array<{ id: string, plans?: Array<{ slug: string }>, regions?: string[] }>} addonProviders
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

      const zones =
        provider.regions
          // Remove clevergrid
          ?.filter((region) => region !== 'clevergrid')
          ?.sort(sortZones) ?? [];
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
  const parts = [];

  for (const [name, entry] of commands.toSorted(([a], [b]) => a.localeCompare(b))) {
    const definition = Array.isArray(entry) ? entry[0] : entry;
    parts.push(getCommandSection(`## ${name}`, [name], definition));

    // Handle [command, {subcommands}] format
    if (Array.isArray(entry) && entry[1]) {
      const subcommands = entry[1];
      for (const [subName, subEntry] of Object.entries(subcommands).sort(([a], [b]) => a.localeCompare(b))) {
        const subDefinition = Array.isArray(subEntry) ? subEntry[0] : subEntry;
        parts.push(getCommandSection(`### ${name} ${subName}`, [name, subName], subDefinition));
      }
    }
  }

  return parts.join('\n\n');
}

/**
 * Generates markdown for a single command.
 * @param {string} heading
 * @param {string[]} path
 * @param {object} definition
 * @return {string}
 */
function getCommandSection(heading, path, definition) {
  const parts = [
    heading,
    `**Description:** ${definition.description}`,
    getCommandUsageMarkdown(path, definition),
  ];

  const argsBlock = getArgumentsBlock(definition.args);
  if (argsBlock) {
    parts.push(argsBlock);
  }

  const optionsBlock = getOptionsBlock(definition.options);
  if (optionsBlock) {
    parts.push(optionsBlock);
  }

  return parts.join('\n\n');
}

/**
 * Generates markdown for command arguments.
 * @param {Array<{placeholder: string, description: string, schema: object}>} [args]
 * @return {string}
 */
function getArgumentsBlock(args) {
  if (!args || args.length === 0) {
    return '';
  }

  const rows = args.map((arg) => {
    const optional = !isRequired(arg.schema) ? ' (optional)' : '';
    return [arg.placeholder, `${arg.description}${optional}`];
  });

  return `**Arguments:**\n\`\`\`\n${formatTable(rows)}\n\`\`\``;
}

/**
 * Generates markdown for command options.
 * @param {Record<string, {aliases?: string[], placeholder?: string, description: string, schema: object}>} [options]
 * @return {string}
 */
function getOptionsBlock(options) {
  if (!options || Object.keys(options).length === 0) {
    return '';
  }

  const rows = Object.entries(options)
    .sort(([a, optA], [b, optB]) => {
      // Required options first, then alphabetically
      const aRequired = isRequired(optA.schema);
      const bRequired = isRequired(optB.schema);
      if (aRequired !== bRequired) return aRequired ? -1 : 1;
      return a.localeCompare(b);
    })
    .map(([name, option]) => {
      // Build --name, -a, --alias (no brackets for required)
      const names = [`--${name}`];
      if (option.aliases) {
        for (const alias of option.aliases) {
          names.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
        }
      }
      const required = isRequired(option.schema);
      const namesPart = required ? names.join(', ') : `[${names.join(', ')}]`;

      // Placeholder (not for booleans)
      const isBool = isBoolean(option.schema);
      const placeholder = isBool ? '' : ` ${option.placeholder ?? name}`;

      // Description with default
      let description = option.description;
      const defaultValue = getDefault(option.schema);
      if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
        description += ` (default: ${defaultValue})`;
      }

      return [`${namesPart}${placeholder}`, description];
    });

  return `**Options:**\n\`\`\`\n${formatTable(rows)}\n\`\`\``;
}
