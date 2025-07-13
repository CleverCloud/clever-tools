#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

let cleverVersion = '';

const COMMAND_TIMEOUT = 10000;
const CLI_COMMAND = process.argv[2] || 'bin/clever.js';
const OUTPUT_FILENAME = process.argv[3] || 'docs/llms-documentation.md';

const SETUP_DOCS_URL = 'https://raw.githubusercontent.com/CleverCloud/clever-tools/refs/heads/master/docs/setup-systems.md';
const OFFICIAL_DOCS_URL = 'https://www.clever-cloud.com/developers/doc/';
const LLMS_DOCS_URL = 'https://www.clever-cloud.com/developers/llms.txt';
const CONSOLE_URL = 'https://console.clever-cloud.com/';
const ADDON_PROVIDERS_URL = 'https://api.clever-cloud.com/v2/products/addonproviders';
const APPLICATION_TYPES_URL = 'https://api.clever-cloud.com/v2/products/instances';
const DEPLOYMENT_ZONES_URL = 'https://api.clever-cloud.com/v4/products/zones';

const DOCUMENT_DESCRIPTION = `This document is automatically generated from Clever Tools \`@@VERSION@@\` and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

To use Clever Tools, you need:
- A Clever Cloud account, create one at ${CONSOLE_URL}
- The Clever Tools CLI installed, see installation instructions below
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
const GLOBAL_OPTIONS_NOTE = '**Note:** The options listed above (`--help`, `--version`, `--color`, `--update-notifier`, `--verbose`) are available for all Clever Tools commands and sub-commands';
const FOOTER_TEXT = `## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: ${OFFICIAL_DOCS_URL}
Clever Cloud complete documentation is available in a LLM-optimized format: ${LLMS_DOCS_URL}
`;

// ANSI COLOR CODES
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
};

/**
 * Utility class for colored console output
 */
class Logger {
  /**
     * Log an info message with cyan color and emoji
     * @param {string} message - The message to log
     */
  static info (message) {
    console.log(`${COLORS.CYAN}ℹ️  ${message}${COLORS.RESET}`);
  }

  /**
     * Log a success message with green color and emoji
     * @param {string} message - The message to log
     */
  static success (message) {
    console.log(`${COLORS.GREEN}✅ ${message}${COLORS.RESET}`);
  }

  /**
     * Log an error message with red color and emoji
     * @param {string} message - The message to log
     */
  static error (message) {
    console.error(`${COLORS.RED}❌ ${message}${COLORS.RESET}`);
  }

  /**
     * Log a warning message with yellow color and emoji
     * @param {string} message - The message to log
     */
  static warn (message) {
    console.warn(`${COLORS.YELLOW}⚠️  ${message}${COLORS.RESET}`);
  }

  /**
     * Log a header message with bright magenta color and emoji
     * @param {string} message - The message to log
     */
  static header (message) {
    console.log(`${COLORS.BRIGHT}${COLORS.MAGENTA}🚀 ${message}${COLORS.RESET}`);
  }

  /**
     * Log a progress message with blue color and emoji
     * @param {string} message - The message to log
     */
  static progress (message) {
    console.log(`${COLORS.BLUE}⚙️  ${message}${COLORS.RESET}`);
  }
}

/**
 * Main class for generating Clever Cloud CLI documentation
 */
class CleverDocGenerator {
  /**
     * Initialize the documentation generator
     */
  constructor () {
    this.output = [];
    this.processedCommands = new Set();
  }

  /**
     * Execute a command and return its output
     * @param {string} command - The command to execute
     * @returns {string|null} Command output or null if error
     */
  execCommand (command) {
    try {
      return execSync(command, { encoding: 'utf8', timeout: COMMAND_TIMEOUT });
    }
    catch (error) {
      Logger.error(`Error executing: ${command}`);
      Logger.error(error.message);
      return null;
    }
  }

  /**
     * Fetch content from a URL using HTTPS
     * @param {string} url - The URL to fetch
     * @returns {Promise<string>} Promise that resolves to the content
     */
  async fetchUrl (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    }
    catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  /**
     * Extract available commands from help output
     * @param {string} helpOutput - The help output text to parse
     * @returns {Array<{name: string, description: string}>} Array of command objects
     */
  extractCommands (helpOutput) {
    const lines = helpOutput.split('\n');
    const commands = [];
    let inCommandsSection = false;

    for (const line of lines) {
      if (line.includes('Available Commands:')) {
        inCommandsSection = true;
        continue;
      }

      if (inCommandsSection && line.trim() === '') {
        break;
      }

      if (inCommandsSection && line.trim()) {
        const match = line.match(/^\s*([a-zA-Z0-9-]+)\s+(.+)$/);
        if (match) {
          commands.push({
            name: match[1].trim(),
            description: match[2].trim(),
          });
        }
      }
    }

    return commands;
  }

  /**
     * Filter out common global options from options list (except for root command)
     * @param {Array<string>} optionsContent - Array of option lines
     * @param {boolean} isRootCommand - Whether this is the root command
     * @returns {Array<string>} Filtered options array
     */
  filterGlobalOptions (optionsContent, isRootCommand) {
    if (isRootCommand) {
      return optionsContent;
    }

    const globalOptions = [
      '--help',
      '--version',
      '--color',
      '--update-notifier',
      '--verbose',
    ];

    return optionsContent.filter((line) => {
      return !globalOptions.some((option) => line.includes(option));
    });
  }

  /**
     * Clean up setup documentation by removing TOC and formatting
     * @param {string} content - The raw setup documentation content
     * @returns {string} Cleaned content
     */
  cleanSetupContent (content) {
    // We add a title level to the setup documentation
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
        }
        else {
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

  /**
     * Format help content for markdown output
     * @param {string} helpOutput - The raw help output from CLI
     * @param {string} commandPath - The command path for the title
     * @param {number} level - The heading level for markdown
     * @returns {string} Formatted markdown content
     */
  formatHelpOutput (helpOutput, commandPath, level = 1) {
    const lines = helpOutput.split('\n');
    const result = [];
    const isRootCommand = (commandPath === CLI_COMMAND);

    // Command title - special case for root command
    const title = isRootCommand ? 'How to use Clever Tools, CLI reference' : commandPath;
    result.push(`${'#'.repeat(level)} ${title}`);
    result.push('');

    // Search for usage line and add it in code block
    const usageLine = lines.find((line) => line.startsWith('Usage:'));
    if (usageLine) {
      // Clean up usage line: replace double spaces with single space, replace commas with spaces
      const cleanUsage = usageLine
        .replace(/  +/g, ' ')
        .replace(/,/g, ' ');

      result.push('```');
      result.push(cleanUsage);
      result.push('```');
      result.push('');
    }

    // Search for description (first non-empty line after Usage)
    let description = '';
    let foundUsage = false;
    for (const line of lines) {
      if (line.startsWith('Usage:')) {
        foundUsage = true;
        continue;
      }
      if (foundUsage && line.trim() && !line.startsWith('Options:') && !line.startsWith('Available Commands:')) {
        description = line.trim();
        break;
      }
    }

    if (description) {
      result.push(`**Description:** ${description}`);
      result.push('');
    }

    // Search for options
    let inOptionsSection = false;
    const optionsContent = [];

    for (const line of lines) {
      if (line.includes('Options:')) {
        inOptionsSection = true;
        continue;
      }

      if (inOptionsSection && line.includes('Available Commands:')) {
        break;
      }

      if (inOptionsSection && line.trim()) {
        optionsContent.push(line);
      }
    }

    if (optionsContent.length > 0) {
      // Filter global options for subcommands
      const filteredOptions = this.filterGlobalOptions(optionsContent, isRootCommand);

      if (filteredOptions.length > 0) {
        result.push('**Options:**');
        result.push('```');
        result.push(...filteredOptions);
        result.push('```');
        result.push('');
      }
    }

    // Add global options note for root command
    if (isRootCommand) {
      result.push(GLOBAL_OPTIONS_NOTE);
    }

    return result.join('\n');
  }

  /**
     * Generate documentation for a command and its subcommands recursively
     * @param {string} commandPath - The command path (empty string for root)
     * @param {number} level - The heading level for markdown
     */
  generateCommandDoc (commandPath, level = 1) {
    const fullCommand = commandPath ? `${CLI_COMMAND} ${commandPath} --help` : `${CLI_COMMAND} --help`;

    Logger.progress(`Adding '${commandPath || 'root command'}' command documentation`);

    if (this.processedCommands.has(commandPath || 'root')) {
      return;
    }
    this.processedCommands.add(commandPath || 'root');

    const helpOutput = this.execCommand(fullCommand);
    if (!helpOutput) {
      return;
    }

    // Add current command documentation
    const formattedHelp = this.formatHelpOutput(helpOutput, commandPath || CLI_COMMAND, level);
    this.output.push(formattedHelp);

    // Extract and process subcommands
    const subCommands = this.extractCommands(helpOutput);

    if (subCommands.length > 0) {
      for (const subCommand of subCommands) {
        const subCommandPath = commandPath ? `${commandPath} ${subCommand.name}` : subCommand.name;
        this.generateCommandDoc(subCommandPath, level + 1);
      }
    }
  }

  /**
     * Generate the complete markdown documentation
     * @returns {Promise<string>} Promise that resolves to the output filename
     */
  async generateFullDocumentation () {
    Logger.progress(`Starting documentation generation for Clever Tools ${cleverVersion}`);

    // Document header
    this.output.push(DOCUMENT_DESCRIPTION
      .replace('@@VERSION@@', cleverVersion));

    // Insert setup documentation without title
    Logger.progress('Fetching setup documentation…');
    try {
      const rawSetupContent = await this.fetchUrl(SETUP_DOCS_URL);
      const cleanSetupContent = this.cleanSetupContent(rawSetupContent);
      this.output.push(cleanSetupContent);
      Logger.success('Setup documentation fetched successfully');
    }
    catch (error) {
      Logger.warn(`Could not fetch setup documentation: ${error.message}`);
      this.output.push('Please refer to the official documentation for installation instructions.');
    }

    // Insert Clever Cloud plans and zones
    Logger.progress('Fetching Clever Cloud deployment zones and add-on providers…');
    try {
      const zones = await getCleverCloudZones();
      const addonProviders = await getCleverCloudAddonProviders();
      const applicationTypes = await getCleverCloudApplicationTypes();
      const applicationFlavors = await getCleverCloudApplicationFlavors();

      this.output.push(DOCUMENT_PLANS_TYPES_ZONES
        .replace('@@APPLICATION_TYPES@@', applicationTypes)
        .replace('@@APPLICATION_FLAVORS@@', applicationFlavors)
        .replace('@@DEPLOYMENT_ZONES@@', zones)
        .replace('@@CLEVER_ADDON_PROVIDERS@@', addonProviders));
      Logger.success('Clever Cloud zones and add-on providers fetched successfully');
    }
    catch (error) {
      Logger.warn(`Could not fetch Clever Cloud zones or add-on providers: ${error.message}`);
      this.output.push('Please refer to the official documentation for available zones and add-on providers.');
    }

    // Generate CLI commands documentation recursively
    this.generateCommandDoc('', 1);

    // Add footer
    this.output.push(FOOTER_TEXT);

    const content = this.output.join('\n');

    // Save file
    fs.writeFileSync(OUTPUT_FILENAME, content, 'utf8');

    console.log('');
    Logger.success(`Documentation generated in: ${path.resolve(OUTPUT_FILENAME)}`);
    Logger.info(`File size: ${(content.length / 1024).toFixed(2)} KB`);
  }
}

function sortZones (zones) {
  zones.sort((a, b) => {
      const aName = a.slice(1, -1);
      const bName = b.slice(1, -1);

      const aStartsWithPar = aName.startsWith('par');
      const bStartsWithPar = bName.startsWith('par');

      if (aStartsWithPar && !bStartsWithPar) return -1;
      if (!aStartsWithPar && bStartsWithPar) return 1;

      return aName.localeCompare(bName);
    });

  return zones;
}

/** * Fetch Clever Cloud add-on providers from the API
 * @returns {Promise<string>} Promise that resolves to a string of add-on providers information
 */
async function getCleverCloudAddonProviders () {
  try {
    const response = await fetch(ADDON_PROVIDERS_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const results = [];

    data.forEach((provider) => {
      results.push(`- \`${provider.id}\`:`);

      if (provider.plans && provider.plans.length > 0) {
        const plans = provider.plans.map((plan) => `\`${plan.slug}\``);
        results.push(`  - plans: ${plans.join(', ')}`);
      }

      if (provider.regions && provider.regions.length > 0) {
        provider.regions = provider.regions.filter((region) => region !== 'clevergrid');
        provider.regions = sortZones(provider.regions);

        const zones = provider.regions.map((zone) => `\`${zone}\``);
        results.push(`  - zones: ${zones.join(', ')}`);
      }

      results.push('');
    });

    return results.join('\n');
  }
  catch (error) {
    throw new Error('Error fetching add-on providers: ' + error.message);
  }
}

/** * Fetch Clever Cloud application types from the API
 * @returns {Promise<string>} Promise that resolves to a string of application types
 */
async function getCleverCloudApplicationTypes () {
  try {
    const response = await fetch(APPLICATION_TYPES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const slugs = data.map((instance) => `\`${instance.variant.slug}\``);

    slugs.sort((a, b) => {
      const aSlug = a.slice(1, -1);
      const bSlug = b.slice(1, -1);
      return aSlug.localeCompare(bSlug);
    });

    return slugs.join(', ');

  }
  catch (error) {
    throw new Error('Error fetching application types: ' + error.message);
  }
}

/** * Fetch Clever Cloud application flavors from the API
 * @returns {Promise<string>} Promise that resolves to a string of application flavors and their availability
 */
async function getCleverCloudApplicationFlavors () {
  try {
    const response = await fetch(APPLICATION_TYPES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const instances = {};
    const allFlavors = new Set();

    data.forEach((item) => {
      if (item.variant?.slug) {
        const instanceName = item.variant.slug;

        if (!instances[instanceName]) {
          instances[instanceName] = new Set();
        }

        if (item.flavors) {
          item.flavors.forEach((flavor) => {
            if (flavor.name) {
              instances[instanceName].add(flavor.name);
              allFlavors.add(flavor.name);
            }
          });
        }
      }
    });

    const allFlavorsArray = Array.from(allFlavors);
    const flavorsMissingInstances = {};

    allFlavorsArray.forEach((flavor) => {
      const instancesWithoutFlavor = [];

      Object.keys(instances).forEach((instanceName) => {
        const instanceFlavors = Array.from(instances[instanceName]);
        if (!instanceFlavors.includes(flavor)) {
          instancesWithoutFlavor.push(instanceName);
        }
      });

      if (instancesWithoutFlavor.length > 0) {
        flavorsMissingInstances[flavor] = instancesWithoutFlavor;
      }
    });

    const results = [];
    results.push(`Available flavors: ${allFlavorsArray.map((f) => `\`${f}\``).join(', ')}`);
    results.push('');

    Object.keys(flavorsMissingInstances).forEach((flavor) => {
      const instances = flavorsMissingInstances[flavor];
      if (instances.length > 0) {
        instances.sort();
        results.push(`Flavor \`${flavor}\` is not available for the following instances: ${instances.map((i) => `\`${i}\``).join(', ')}`);
      }
    });

    return results.join('\n');
  }
  catch (error) {
    throw new Error('Error fetching application flavors: ' + error.message);
  }
}

/** * Fetch Clever Cloud deployment zones from the API
 * @returns {Promise<string>} Promise that resolves to a string of zone names
 */
async function getCleverCloudZones () {
  try {
    const response = await fetch(DEPLOYMENT_ZONES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let zones = data.map((zone) => `\`${zone.name}\``);
    zones = sortZones(zones);

    return zones.join(', ');
  }
  catch (error) {
    console.error('Error fetching zones:', error.message);
    process.exit(1);
  }
}

/**
 * Main function that orchestrates the documentation generation process
 * @returns {Promise<void>} Promise that resolves when generation is complete
 */
async function main () {
  Logger.header('Clever Tools LLM documentation generator');
  console.log('');

  // Check if clever CLI is available
  try {
    cleverVersion = execSync(`${CLI_COMMAND} version`, { encoding: 'utf8', timeout: 10000 }).trim();
    Logger.success('Clever Tools detected');
  }
  catch (error) {
    Logger.error('Clever Tools not found');
    Logger.error(`Make sure "${CLI_COMMAND}" is installed and accessible in PATH`);
    process.exit(1);
  }

  const generator = new CleverDocGenerator();

  try {
    await generator.generateFullDocumentation();
    Logger.info('This file can now be used to train or assist AIs to use Clever Tools commands correctly');
  }
  catch (error) {
    console.log('');
    Logger.error(`Error during generation: ${error.message}`);
    process.exit(1);
  }
}

main();
