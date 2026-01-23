#!/usr/bin/env node
//
// Generate documentation for Clever Tools commands.
//
// This script generates markdown documentation files for all CLI commands,
// including the README, per-command docs, and LLM-optimized documentation.
//
// USAGE: generate-docs.js [--check]
//
// OPTIONS:
//   --check         Check if docs are up-to-date without writing
//
// EXAMPLES:
//   generate-docs.js
//   generate-docs.js --check

import { CcApiClient } from '@clevercloud/client/cc-api-client.js';
import { ListProductAddonCommand } from '@clevercloud/client/cc-api-commands/product/list-product-addon-command.js';
import { ListProductRuntimeCommand } from '@clevercloud/client/cc-api-commands/product/list-product-runtime-command.js';
import { ListZoneCommand } from '@clevercloud/client/cc-api-commands/zone/list-zone-command.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { globalCommands } from '../src/commands/global.commands.js';
import { colorOption, updateNotifierOption, verboseOption } from '../src/commands/global.options.js';
import { styleText } from '../src/lib/style-text.js';
import { conf } from '../src/models/configuration.js';
import { runCommand } from './lib/command.js';
import { getLlmsDocumentation } from './lib/docs-llm.js';
import { getDocRelativePath, getReadmeMarkdown, getRootCommandMarkdown } from './lib/docs-reference.js';
import { parseMarkdown } from './lib/markdown.js';

/**
 * @typedef {{ path: string, changed: boolean }} FileResult
 */

const typedGlobalCommands = globalCommands;

const apiClient = new CcApiClient({ baseUrl: conf.API_HOST });

runCommand(async () => {
  const checkMode = process.argv.includes('--check');

  if (!checkMode) {
    console.log('Updating docs...');
  }

  const commands = Object.entries(typedGlobalCommands);

  const results = [
    await generateCommandsReadme(commands, checkMode),
    ...(await generateCommandDocs(commands, checkMode)),
    await generateLlmsDocs(commands, checkMode),
  ];

  reportResults(results, checkMode);
});

/**
 * Generates the main README with the list of commands.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<FileResult>}
 */
async function generateCommandsReadme(commands, checkMode) {
  const readmePath = path.resolve(import.meta.dirname, '../src/commands/README.md');
  const existingReadme = await fs.readFile(readmePath, 'utf-8').catch(() => null);

  const newMarkdown =
    getReadmeMarkdown(commands, { colorOption, verboseOption, updateNotifierOption }, getDocRelativePath) + '\n';

  return processFile(readmePath, existingReadme, newMarkdown, checkMode);
}

/**
 * Generates documentation for each command.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<FileResult[]>}
 */
async function generateCommandDocs(commands, checkMode) {
  const commandsDir = path.resolve(import.meta.dirname, '../src/commands');
  /** @type {FileResult[]} */
  const results = [];

  for (const [rootCommandName, entry] of commands) {
    const docPath = path.join(commandsDir, getDocRelativePath(rootCommandName));

    const existingContent = await fs.readFile(docPath, 'utf-8').catch(() => null);
    const existingAst = existingContent ? parseMarkdown(existingContent) : null;

    const newContent = getRootCommandMarkdown(rootCommandName, entry, existingAst) + '\n';
    const fileResult = await processFile(docPath, existingContent, newContent, checkMode);
    results.push(fileResult);
  }

  return results;
}

/**
 * Generates LLM-optimized documentation.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<FileResult>}
 */
async function generateLlmsDocs(commands, checkMode) {
  const llmsDocumentationPath = path.resolve(import.meta.dirname, '../docs/llms-documentation.md');
  const setupDocsPath = path.resolve(import.meta.dirname, '../docs/setup-systems.md');

  const existingLlmsDocumentation = await fs.readFile(llmsDocumentationPath, 'utf-8').catch(() => null);
  const rawSetupContent = await fs.readFile(setupDocsPath, 'utf8').catch(() => '');

  const [deploymentZones, rawAddonProviders, instances] = await Promise.all([
    apiClient.send(new ListZoneCommand()),
    apiClient.send(new ListProductAddonCommand({ withVersions: false })),
    apiClient.send(new ListProductRuntimeCommand()),
  ]);

  // Filter addon provider zones to only include public zones
  const publicZoneNames = new Set(deploymentZones.map((zone) => zone.name));
  const addonProviders = rawAddonProviders.map((provider) => ({
    ...provider,
    zones: provider.zones?.filter((zone) => publicZoneNames.has(zone)),
  }));

  const newLlmsDocumentation =
    getLlmsDocumentation(commands, {
      rawSetupContent,
      deploymentZones,
      addonProviders,
      instances,
    }) + '\n';

  return processFile(llmsDocumentationPath, existingLlmsDocumentation, newLlmsDocumentation, checkMode);
}

/**
 * Reports results.
 * @param {FileResult[]} results
 * @param {boolean} checkMode
 */
function reportResults(results, checkMode) {
  const changed = results.filter((r) => r.changed);
  const unchanged = results.filter((r) => !r.changed);

  if (checkMode) {
    if (changed.length === 0) {
      console.log(styleText('green', `All docs up-to-date (${results.length} files)`));
      return;
    }

    for (const { path: filePath } of changed) {
      console.warn(`[${styleText('yellow', 'warn')}] ${path.relative(process.cwd(), filePath)}`);
    }
    console.warn(
      `[${styleText('yellow', 'warn')}] Docs outdated in ${changed.length} files (${results.length} total). Run without --check to fix.`,
    );

    process.exit(1);
  }

  // Write mode
  if (changed.length === 0) {
    console.log(styleText('green', `All files up-to-date (${results.length} files)`));
  } else {
    console.log(`Updated ${changed.length} files (${unchanged.length} unchanged)`);
  }
}

/**
 * Writes a file if changed, or tracks it as outdated in check mode.
 * @param {string} filePath
 * @param {string | null} existingContent
 * @param {string} newContent
 * @param {boolean} checkMode
 * @return {Promise<FileResult>}
 */
async function processFile(filePath, existingContent, newContent, checkMode) {
  const changed = existingContent !== newContent;

  if (!checkMode && changed) {
    await fs.writeFile(filePath, newContent);
    console.log(path.relative(process.cwd(), filePath));
  }

  return { path: filePath, changed };
}
