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

import { getAllAddonProviders, getAvailableInstances } from '@clevercloud/client/esm/api/v2/product.js';
import { getAllZones } from '@clevercloud/client/esm/api/v4/product.js';
import { prefixUrl } from '@clevercloud/client/esm/prefix-url.js';
import { request } from '@clevercloud/client/esm/request.fetch.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import pkg from '../package.json' with { type: 'json' };
import { globalCommands } from '../src/commands2/global.commands.js';
import { colorOption, updateNotifierOption, verboseOption } from '../src/commands2/global.options.js';
import { styleText } from '../src/lib/style-text.js';
import { conf } from '../src/models/configuration.js';
import { runCommand } from './lib/command.js';
import { getDocRelativePath, getReadmeMarkdown, getRootCommandMarkdown } from './lib/docs-reference.js';
import { getLlmsDocumentation } from './lib/docs-llm.js';
import { parseMarkdown } from './lib/markdown.js';

/**
 * @typedef {import('@clevercloud/client/esm/request.types.js').RequestParams} RequestParams
 */

const typedGlobalCommands = globalCommands;

runCommand(async () => {
  const checkMode = process.argv.includes('--check');

  if (!checkMode) {
    console.log('Updating docs...');
  }

  const commands = Object.entries(typedGlobalCommands);

  const outdatedReadme = await generateCommandsReadme(commands, checkMode);
  const outdatedCommandDocs = await generateCommandDocs(commands, checkMode);
  const outdatedLlmsDocs = await generateLlmsDocs(commands, checkMode);

  if (checkMode) {
    const outdatedFiles = [outdatedReadme, ...outdatedCommandDocs, outdatedLlmsDocs].filter((f) => f != null);
    reportResults(outdatedFiles);
  }
});

/**
 * Generates the main README with the list of commands.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<string | null>} The file path if outdated, null otherwise
 */
async function generateCommandsReadme(commands, checkMode) {
  const readmePath = path.resolve(import.meta.dirname, '../src/commands2/README.md');
  const existingReadme = await fs.readFile(readmePath, 'utf-8').catch(() => null);

  const newMarkdown =
    getReadmeMarkdown(commands, { colorOption, verboseOption, updateNotifierOption }, getDocRelativePath) + '\n';

  const isOutdated = await processFile(readmePath, existingReadme, newMarkdown, checkMode);
  return isOutdated ? readmePath : null;
}

/**
 * Generates documentation for each command.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<string[]>} List of outdated files
 */
async function generateCommandDocs(commands, checkMode) {
  const commandsDir = path.resolve(import.meta.dirname, '../src/commands2');
  /** @type {Array<string>} */
  const outdatedFiles = [];

  for (const [rootCommandName, entry] of commands) {
    const docPath = path.join(commandsDir, getDocRelativePath(rootCommandName));

    const existingContent = await fs.readFile(docPath, 'utf-8').catch(() => null);
    const existingAst = existingContent ? parseMarkdown(existingContent) : null;

    const newContent = getRootCommandMarkdown(rootCommandName, entry, existingAst) + '\n';
    const isOutdated = await processFile(docPath, existingContent, newContent, checkMode);
    if (isOutdated) {
      outdatedFiles.push(docPath);
    }
  }

  return outdatedFiles;
}

/**
 * Generates LLM-optimized documentation.
 * @param {Array<[string, unknown]>} commands
 * @param {boolean} checkMode
 * @return {Promise<string | null>} The file path if outdated, null otherwise
 */
async function generateLlmsDocs(commands, checkMode) {
  const llmsDocumentationPath = path.resolve(import.meta.dirname, '../docs/llms-documentation2.md');
  const setupDocsPath = path.resolve(import.meta.dirname, '../docs/setup-systems.md');

  const existingLlmsDocumentation = await fs.readFile(llmsDocumentationPath, 'utf-8').catch(() => null);
  const rawSetupContent = await fs.readFile(setupDocsPath, 'utf8').catch(() => '');

  const [deploymentZones, addonProviders, instances] = await Promise.all([
    getAllZones().then(sendToApiPublic),
    // @ts-expect-error No params needed for public API
    getAllAddonProviders().then(sendToApiPublic),
    // @ts-expect-error No params needed for public API
    getAvailableInstances().then(sendToApiPublic),
  ]);

  const newLlmsDocumentation =
    getLlmsDocumentation(commands, {
      version: pkg.version,
      rawSetupContent,
      deploymentZones,
      addonProviders,
      instances,
    }) + '\n';

  const isOutdated = await processFile(
    llmsDocumentationPath,
    existingLlmsDocumentation,
    newLlmsDocumentation,
    checkMode,
  );
  return isOutdated ? llmsDocumentationPath : null;
}

/**
 * Reports results in check mode.
 * @param {string[]} outdatedFiles
 */
function reportResults(outdatedFiles) {
  process.stdout.write('\r\x1b[K');

  if (outdatedFiles.length <= 0) {
    console.log('All docs are up-to-date.');
    return;
  }

  for (const file of outdatedFiles) {
    console.warn(`[${styleText('yellow', 'warn')}] ${path.relative(process.cwd(), file)}`);
  }
  console.warn(
    `[${styleText('yellow', 'warn')}] Docs are outdated in ${outdatedFiles.length} files. Run without --check to fix.`,
  );

  process.exit(1);
}

/**
 * Writes a file if changed, or tracks it as outdated in check mode.
 * @param {string} filePath
 * @param {string | null} existingContent
 * @param {string} newContent
 * @param {boolean} checkMode
 * @return {Promise<boolean>} True if the file is outdated (in check mode)
 */
async function processFile(filePath, existingContent, newContent, checkMode) {
  const isOutdated = existingContent !== newContent;
  const relativePath = path.relative(process.cwd(), filePath);

  if (checkMode) {
    process.stdout.write(`\rChecking docs... ${relativePath}`);
    return isOutdated;
  }

  if (isOutdated) {
    await fs.writeFile(filePath, newContent);
    console.log(relativePath);
  } else {
    console.log(`${styleText('dim', relativePath)} (unchanged)`);
  }

  return false;
}

/**
 * Sends a request to the Clever Cloud public API.
 * @param {RequestParams} requestParams
 * @return {Promise<any>}
 */
async function sendToApiPublic(requestParams) {
  // @ts-ignore
  return Promise.resolve(requestParams).then(prefixUrl(conf.API_HOST)).then(request);
}
