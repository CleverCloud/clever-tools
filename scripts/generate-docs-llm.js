#!/usr/bin/env node

/**
 * LLM Documentation Generator v2
 *
 * Generates documentation for Clever Tools optimized for LLMs and AI-assisted IDEs.
 * This version uses globalCommands directly instead of executing CLI commands.
 */

import { getAllAddonProviders, getAvailableInstances } from '@clevercloud/client/esm/api/v2/product.js';
import { getAllZones } from '@clevercloud/client/esm/api/v4/product.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import pkg from '../package.json' with { type: 'json' };
import { globalCommands } from '../src/commands2/global.commands.js';
import { styleText } from '../src/lib/style-text.js';
import { conf } from '../src/models/configuration.js';
import { flattenCommands, getSchemaDefault, isBooleanFlag } from './lib/command-helpers.js';

const OUTPUT_FILENAME = process.argv[2] || 'docs/llms-documentation-v2.md';
const SETUP_DOCS_PATH = path.resolve(import.meta.dirname, '../docs/setup-systems.md');

const OFFICIAL_DOCS_URL = 'https://www.clever-cloud.com/developers/doc/';
const LLMS_DOCS_URL = 'https://www.clever-cloud.com/developers/llms.txt';

const DOCUMENT_DESCRIPTION = `This document is automatically generated from Clever Tools \`@@VERSION@@\` and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

To use Clever Tools, you need:
- A Clever Cloud account, create one at ${conf.CONSOLE_URL}/
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
`;

const DOCUMENT_PLANS_TYPES_ZONES = `## Application types and zones

You can deploy applications on Clever Cloud with the following runtimes type: @@APPLICATION_TYPES@@

@@APPLICATION_FLAVORS@@

Applications deployment zones (region): @@DEPLOYMENT_ZONES@@

## Add-on providers, plans and zones (region)

@@CLEVER_ADDON_PROVIDERS@@
Default deployment zone is \`par\`, default plan is the lowest available.
`;

const GLOBAL_OPTIONS_NOTE =
  '**Note:** The options listed above (`--help`, `--version`, `--color`, `--update-notifier`, `--verbose`) are available for all Clever Tools commands and sub-commands';

const FOOTER_TEXT = `## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: ${OFFICIAL_DOCS_URL}
Clever Cloud complete documentation is available in a LLM-optimized format: ${LLMS_DOCS_URL}
`;

// Global options to filter out from subcommands
const GLOBAL_OPTION_NAMES = ['help', 'version', 'color', 'update-notifier', 'verbose'];

// ============================================================================
// Logger functions
// ============================================================================

function logInfo(message) {
  console.log(styleText('cyan', `ℹ️  ${message}`));
}

function logSuccess(message) {
  console.log(styleText('green', `✅ ${message}`));
}

function logError(message) {
  console.error(styleText('red', `❌ ${message}`));
}

function logProgress(message) {
  console.log(styleText('blue', `⚙️  ${message}`));
}

function logHeader(message) {
  console.log(styleText('magenta', `🚀 ${message}`));
}

// ============================================================================
// API functions (public endpoints, no auth required)
// ============================================================================

async function sendToApiPublic(requestParams) {
  return Promise.resolve(requestParams).then(prefixUrl(conf.API_HOST)).then(request);
}

function sortZones(zones) {
  zones.sort((a, b) => {
    const aName = a.startsWith('`') ? a.slice(1, -1) : a;
    const bName = b.startsWith('`') ? b.slice(1, -1) : b;

    const aStartsWithPar = aName.startsWith('par');
    const bStartsWithPar = bName.startsWith('par');

    if (aStartsWithPar && !bStartsWithPar) return -1;
    if (!aStartsWithPar && bStartsWithPar) return 1;

    return aName.localeCompare(bName);
  });

  return zones;
}

async function getCleverCloudZones() {
  const data = await getAllZones().then(sendToApiPublic);
  let zones = data.map((zone) => `\`${zone.name}\``);
  zones = sortZones(zones);
  return zones.join(', ');
}

async function getCleverCloudAddonProviders() {
  const data = await getAllAddonProviders({}).then(sendToApiPublic);
  const results = [];

  for (const provider of data) {
    results.push(`- \`${provider.id}\`:`);

    if (provider.plans && provider.plans.length > 0) {
      const plans = provider.plans.map((plan) => `\`${plan.slug}\``);
      results.push(`  - plans: ${plans.join(', ')}`);
    }

    if (provider.regions && provider.regions.length > 0) {
      let regions = provider.regions.filter((region) => region !== 'clevergrid');
      regions = sortZones(regions);
      const zones = regions.map((zone) => `\`${zone}\``);
      results.push(`  - zones: ${zones.join(', ')}`);
    }

    results.push('');
  }

  return results.join('\n');
}

async function getCleverCloudApplicationTypes() {
  const data = await getAvailableInstances({}).then(sendToApiPublic);
  const slugs = data.map((instance) => `\`${instance.variant.slug}\``);

  slugs.sort((a, b) => {
    const aSlug = a.slice(1, -1);
    const bSlug = b.slice(1, -1);
    return aSlug.localeCompare(bSlug);
  });

  return slugs.join(', ');
}

async function getCleverCloudApplicationFlavors() {
  const data = await getAvailableInstances({}).then(sendToApiPublic);
  const instances = {};
  const allFlavors = new Set();

  for (const item of data) {
    if (item.variant?.slug) {
      const instanceName = item.variant.slug;

      if (!instances[instanceName]) {
        instances[instanceName] = new Set();
      }

      if (item.flavors) {
        for (const flavor of item.flavors) {
          if (flavor.name) {
            instances[instanceName].add(flavor.name);
            allFlavors.add(flavor.name);
          }
        }
      }
    }
  }

  const allFlavorsArray = Array.from(allFlavors);
  const flavorsMissingInstances = {};

  for (const flavor of allFlavorsArray) {
    const instancesWithoutFlavor = [];

    for (const instanceName of Object.keys(instances)) {
      const instanceFlavors = Array.from(instances[instanceName]);
      if (!instanceFlavors.includes(flavor)) {
        instancesWithoutFlavor.push(instanceName);
      }
    }

    if (instancesWithoutFlavor.length > 0) {
      flavorsMissingInstances[flavor] = instancesWithoutFlavor;
    }
  }

  const results = [];
  results.push(`Available flavors: ${allFlavorsArray.map((f) => `\`${f}\``).join(', ')}`);
  results.push('');

  for (const flavor of Object.keys(flavorsMissingInstances)) {
    const missingInstances = flavorsMissingInstances[flavor];
    if (missingInstances.length > 0) {
      missingInstances.sort();
      results.push(
        `Flavor \`${flavor}\` is not available for the following instances: ${missingInstances.map((i) => `\`${i}\``).join(', ')}`,
      );
    }
  }

  return results.join('\n');
}

// ============================================================================
// Setup docs processing
// ============================================================================

function cleanSetupContent(content) {
  // Add a title level to the setup documentation
  const lines = content.replace(/^(#+ )/gm, '#$1').split('\n');
  const cleanedLines = [];
  let inTOC = false;

  for (const line of lines) {
    // Detect start of TOC (lines with links to /docs/setup-systems.md)
    if (line.includes('/docs/setup-systems.md#') && line.trim().startsWith('- [')) {
      inTOC = true;
      continue;
    }

    // Detect end of TOC (empty line or line that doesn't match TOC pattern)
    if (inTOC) {
      if (line.trim() === '' || (!line.includes('/docs/setup-systems.md#') && !line.trim().startsWith('- ['))) {
        inTOC = false;
        // Add the current line if it's not empty (end of TOC)
        if (line.trim() !== '') {
          cleanedLines.push(line);
        }
        continue;
      } else {
        // Skip TOC lines
        continue;
      }
    }

    // Add non-TOC lines
    if (!inTOC) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

// ============================================================================
// Command documentation generation
// ============================================================================

/**
 * Format an option for display in the options list.
 * Format: [--name, -a] PLACEHOLDER    Description (default: value)
 */
function formatOptionLine(name, option) {
  const parts = [];

  // Build the option names part: [--name, -a, --alias]
  const names = [];
  names.push(`--${name}`);
  if (option.aliases) {
    for (const alias of option.aliases) {
      names.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
    }
  }
  parts.push(`[${names.join(', ')}]`);

  // Add placeholder for non-boolean options
  const isBoolean = isBooleanFlag(option);
  if (!isBoolean) {
    const placeholder = option.placeholder || name;
    parts.push(placeholder.toUpperCase());
  }

  // Build the description part with default value
  let description = option.description || '';
  const defaultValue = getSchemaDefault(option.schema);

  if (defaultValue !== undefined && defaultValue !== null) {
    if (typeof defaultValue === 'boolean') {
      description += ` (default: ${defaultValue})`;
    } else if (defaultValue !== '') {
      description += ` (default: ${defaultValue})`;
    }
  }

  // Combine: pad the option+placeholder part to align descriptions
  const optionPart = parts.join(' ');
  return `${optionPart.padEnd(35)}${description}`;
}

/**
 * Generate markdown documentation for a single command.
 */
function formatCommandDoc(cmd, level = 1, isRoot = false) {
  const result = [];

  // Command title
  const title = isRoot ? 'How to use Clever Tools, CLI reference' : cmd.path;
  result.push(`${'#'.repeat(level)} ${title}`);
  result.push('');

  // Usage line
  const usageParts = [];
  if (!isRoot) {
    usageParts.push(cmd.path.split(' ').slice(-1)[0]); // Just the command name, not full path
  }

  // Add positional arguments
  if (cmd.command.args && cmd.command.args.length > 0) {
    for (const arg of cmd.command.args) {
      usageParts.push(arg.placeholder.toUpperCase());
    }
  }

  result.push('```');
  result.push(`Usage: ${usageParts.join(' ') || 'clever'}`);
  result.push('```');
  result.push('');

  // Description
  if (cmd.command.description) {
    result.push(`**Description:** ${cmd.command.description}`);
    result.push('');
  }

  // Options
  const options = cmd.command.options || {};
  const optionEntries = Object.entries(options);

  // Filter out global options for non-root commands
  const filteredOptions = isRoot
    ? optionEntries
    : optionEntries.filter(([name]) => !GLOBAL_OPTION_NAMES.includes(name));

  // Sort options alphabetically by name
  filteredOptions.sort(([a], [b]) => a.localeCompare(b));

  if (filteredOptions.length > 0) {
    result.push('**Options:**');
    result.push('```');
    for (const [name, option] of filteredOptions) {
      result.push(formatOptionLine(name, option));
    }
    result.push('```');
    result.push('');
  }

  // Add global options note for root command
  if (isRoot) {
    result.push(GLOBAL_OPTIONS_NOTE);
  }

  return result.join('\n') + '\n';
}

/**
 * Generate documentation for the root command (clever --help equivalent).
 */
function generateRootCommandDoc() {
  // Create a fake root command with global options
  const rootCommand = {
    path: 'clever',
    command: {
      description: "CLI tool to manage Clever Cloud's data and products",
      options: {
        help: {
          name: 'help',
          description: 'Display help about this program',
          aliases: ['?'],
          schema: { def: { type: 'default', defaultValue: false, innerType: { type: 'boolean' } } },
        },
        version: {
          name: 'version',
          description: 'Display the version of this program',
          aliases: ['V'],
          schema: { def: { type: 'default', defaultValue: false, innerType: { type: 'boolean' } } },
        },
        color: {
          name: 'color',
          description: 'Choose whether to print colors or not. You can also use --no-color',
          schema: { def: { type: 'default', defaultValue: true, innerType: { type: 'boolean' } } },
        },
        'update-notifier': {
          name: 'update-notifier',
          description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
          schema: { def: { type: 'default', defaultValue: true, innerType: { type: 'boolean' } } },
        },
        verbose: {
          name: 'verbose',
          description: 'Verbose output',
          aliases: ['v'],
          schema: { def: { type: 'default', defaultValue: false, innerType: { type: 'boolean' } } },
        },
      },
    },
  };

  return formatCommandDoc(rootCommand, 1, true);
}

/**
 * Generate documentation for all commands recursively.
 */
function generateAllCommandsDocs() {
  const output = [];

  // Root command first
  output.push(generateRootCommandDoc());

  // Flatten and process all commands
  const allCommands = flattenCommands(globalCommands);

  for (const cmd of allCommands) {
    logProgress(`Adding '${cmd.path}' command documentation`);

    // Determine heading level based on command depth
    const depth = cmd.path.split(' ').length;
    const level = depth + 1; // ## for top-level, ### for subcommands, etc.

    output.push(formatCommandDoc(cmd, level, false));
  }

  return output.join('');
}

// ============================================================================
// Main generation function
// ============================================================================

async function generateFullDocumentation() {
  const output = [];

  logProgress(`Starting documentation generation for Clever Tools ${pkg.version}`);

  // Document header
  output.push(DOCUMENT_DESCRIPTION.replace('@@VERSION@@', pkg.version));

  // Insert setup documentation
  logProgress('Reading setup documentation...');
  try {
    const rawSetupContent = await fs.readFile(SETUP_DOCS_PATH, 'utf8');
    const processedSetupContent = cleanSetupContent(rawSetupContent);
    output.push(processedSetupContent);
    logSuccess('Setup documentation loaded');
  } catch (error) {
    logError(`Could not read setup documentation: ${error.message}`);
    output.push('Please refer to the official documentation for installation instructions.');
  }

  // Fetch API data in parallel
  logProgress('Fetching Clever Cloud deployment zones and add-on providers...');
  try {
    const [zones, addonProviders, applicationTypes, applicationFlavors] = await Promise.all([
      getCleverCloudZones(),
      getCleverCloudAddonProviders(),
      getCleverCloudApplicationTypes(),
      getCleverCloudApplicationFlavors(),
    ]);

    output.push(
      DOCUMENT_PLANS_TYPES_ZONES.replace('@@APPLICATION_TYPES@@', applicationTypes)
        .replace('@@APPLICATION_FLAVORS@@', applicationFlavors)
        .replace('@@DEPLOYMENT_ZONES@@', zones)
        .replace('@@CLEVER_ADDON_PROVIDERS@@', addonProviders),
    );
    logSuccess('Clever Cloud zones and add-on providers fetched successfully');
  } catch (error) {
    logError(`Could not fetch Clever Cloud data: ${error.message}`);
    output.push('Please refer to the official documentation for available zones and add-on providers.');
  }

  // Generate CLI commands documentation
  logProgress('Generating CLI commands documentation...');
  output.push(generateAllCommandsDocs());
  logSuccess('CLI commands documentation generated');

  // Add footer
  output.push(FOOTER_TEXT);

  const content = output.join('\n');

  // Save file
  const outputPath = path.resolve(OUTPUT_FILENAME);
  await fs.writeFile(outputPath, content, 'utf8');

  console.log('');
  logSuccess(`Documentation generated in: ${outputPath}`);
  logInfo(`File size: ${(content.length / 1024).toFixed(2)} KB`);
}

// ============================================================================
// Main entry point
// ============================================================================

async function main() {
  logHeader('Clever Tools LLM documentation generator v2');
  console.log('');

  logSuccess(`Clever Tools ${pkg.version} detected`);

  try {
    await generateFullDocumentation();
    logInfo('This file can now be used to train or assist AIs to use Clever Tools commands correctly');
  } catch (error) {
    console.log('');
    logError(`Error during generation: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
