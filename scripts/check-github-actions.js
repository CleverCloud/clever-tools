#!/usr/bin/env node
//
// Analyze GitHub Actions workflows and check secrets/variables usage.
//
// This script scans all workflow files in .github/workflows/, extracts required
// secrets and variables, compares them with what's actually configured in the
// repository, and generates a comprehensive report.
//
// USAGE: check-github-actions.js
//
// REQUIRED SYSTEM BINARIES:
//   gh              GitHub CLI for listing secrets and variables
//
// EXAMPLES:
//   check-github-actions.js

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { globSync } from 'tinyglobby';
import { runCommand } from './lib/command.js';

const SECRET_REGEX = /\$\{\{\s*secrets\.([A-Z_][A-Z0-9_]*)\s*}}/g;
const VARIABLES_REGEX = /\$\{\{\s*vars\.([A-Z_][A-Z0-9_]*)\s*}}/g;

runCommand(async () => {
  console.log('# GitHub Actions secrets and vars report\n');

  const workflowFiles = globSync('.github/workflows/*.{yml,yaml}');

  if (workflowFiles.length === 0) {
    console.log('No workflow files found in .github/workflows/');
    process.exit(0);
  }

  console.log(`## Workflows (${workflowFiles.length})\n`);
  const formattedWorkflows = workflowFiles.map((file) => `- ${file}`).join('\n');
  console.log(formattedWorkflows);

  const { requiredSecrets, requiredVariables } = await parseWorkflows(workflowFiles);

  const currentSecrets = getGitHubData('gh secret list --json name');
  const currentSecretsNames = new Set(currentSecrets.keys());
  const notUsedSecrets = [...currentSecretsNames.difference(requiredSecrets)].sort();
  const missingSecrets = [...requiredSecrets.difference(currentSecretsNames)].sort();
  reportSection('Secrets', requiredSecrets, currentSecrets, notUsedSecrets);

  const currentVariables = getGitHubData('gh variable list --json name,value');
  const currentVariableNames = new Set(currentVariables.keys());
  const notUsedVariables = [...currentVariableNames.difference(requiredVariables)].sort();
  const missingVariables = [...requiredVariables.difference(currentVariableNames)].sort();
  reportSection('Variables', requiredVariables, currentVariables, notUsedVariables, true);

  if (missingSecrets.length > 0 || missingVariables.length > 0) {
    process.exit(1);
  }
});

/**
 * Parses workflow files and extracts required secrets and variables.
 * @param {string[]} workflowFiles - Array of workflow file paths
 * @returns {Promise<{requiredSecrets: Set<string>, requiredVariables: Set<string>}>}
 */
async function parseWorkflows(workflowFiles) {
  const requiredSecrets = new Set();
  const requiredVariables = new Set();

  for (const file of workflowFiles) {
    const content = await fs.readFile(file, 'utf8');
    for (const [_, match] of content.matchAll(SECRET_REGEX)) {
      // GITHUB_TOKEN is always present in GitHub action and does not need to be set
      if (match !== 'GITHUB_TOKEN') {
        requiredSecrets.add(match);
      }
    }
    for (const [_, match] of content.matchAll(VARIABLES_REGEX)) {
      requiredVariables.add(match);
    }
  }

  return { requiredSecrets, requiredVariables };
}

/**
 * Reports the status of required items (secrets or variables).
 * @param {string} title - Section title (e.g., "Secrets", "Variables")
 * @param {Set<string>} requiredItems - Set of required item names
 * @param {Map<string,string>} currentItems - Map of current items
 * @param {string[]} unusedItems - Array of unused item names
 * @param {boolean} showValues - Whether to show values (for variables)
 */
function reportSection(title, requiredItems, currentItems, unusedItems, showValues = false) {
  console.log(`\n## ${title} (${requiredItems.size})\n`);

  if (requiredItems.size === 0) {
    console.log(`No ${title.toLowerCase()} required.`);
  } else {
    const sortedRequired = [...requiredItems].sort();
    for (const item of sortedRequired) {
      const value = currentItems.get(item);
      if (currentItems.has(item)) {
        if (showValues && value != null) {
          console.log(`- ✅ ${item}: ${value}`);
        } else {
          console.log(`- ✅ ${item}`);
        }
      } else {
        console.log(`- ❌ ${item}`);
      }
    }
  }

  if (unusedItems.length > 0) {
    console.log(`\n${unusedItems.length} unused ${title.toLowerCase().slice(0, -1)}(s): ${unusedItems.join(', ')}`);
  }
}

/**
 * Executes a GitHub CLI command and returns a Map.
 * @param {string} command - GitHub CLI command to execute
 * @returns {Map<string, string>} Map with names as keys, values for variables, null for secrets
 */
function getGitHubData(command) {
  try {
    const listJson = execSync(command, { encoding: 'utf8' });
    /** @type {Array<{name: string, value: string}>} */
    const list = JSON.parse(listJson);
    return new Map(list.map((item) => [item.name, item.value]));
  } catch (error) {
    console.error(`Error executing GitHub CLI command: ${error.message}`);
    console.error('Make sure the "gh" CLI is installed and you are authenticated.');
    process.exit(1);
  }
}
