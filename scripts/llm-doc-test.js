#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

const CLI_COMMAND = process.argv[2] || 'bin/clever.js';
const DOCS_FILENAME = process.argv[3] || 'docs/llms-documentation.md';

function exec (cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 });
  }
  catch {
    return null;
  }
}

function extractCommands (helpOutput) {
  const commands = [];
  let inSection = false;

  for (const line of helpOutput.split('\n')) {
    if (line.includes('Available Commands:')) inSection = true;
    else if (inSection && !line.trim()) break;
    else if (inSection && line.trim()) {
      const match = line.match(/^\s*([a-zA-Z0-9-]+)/);
      if (match) commands.push(match[1]);
    }
  }
  return commands;
}

function getAllCommands (path = '', found = new Set()) {
  const cmd = path ? `${CLI_COMMAND} ${path} --help` : `${CLI_COMMAND} --help`;
  const output = exec(cmd);
  if (!output) return found;

  found.add(path || CLI_COMMAND);
  extractCommands(output).forEach((sub) => {
    getAllCommands(path ? `${path} ${sub}` : sub, found);
  });
  return found;
}

function getDocumentedCommands (content) {
  const commands = new Set();
  let inCliSection = false;

  for (const line of content.split('\n')) {
    if (line.includes('How to use Clever Tools, CLI reference')) {
      inCliSection = true;
      commands.add(CLI_COMMAND);
    }
    else if (line.includes('Clever Cloud complete documentation')) {
      break;
    }
    else if (inCliSection) {
      const match = line.match(/^#+\s+(.+)$/);
      if (match) commands.add(match[1].trim());
    }
  }
  return commands;
}

function main () {
  console.log('🔍 Verifying Clever Tools LLM documentation…');
  console.log('');

  if (!exec(`${CLI_COMMAND} --help`)) {
    console.error('❌ Clever Tools binary not found');
    process.exit(1);
  }

  if (!fs.existsSync(DOCS_FILENAME)) {
    console.error('❌ AI documentation file not found');
    process.exit(1);
  }

  const cliCommands = getAllCommands();
  const docCommands = getDocumentedCommands(fs.readFileSync(DOCS_FILENAME, 'utf8'));

  const missing = [...cliCommands].filter((c) => !docCommands.has(c));
  const extra = [...docCommands].filter((c) => !cliCommands.has(c));

  console.log(`Clever Tools commands: ${cliCommands.size}, LLM documentation commands: ${docCommands.size}`);

  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ All commands are documented!');
  }
  else {
    if (missing.length) {
      console.log('❌ Missing commands:', missing.join(', '));
    }
    if (extra.length) {
      console.log('⚠️  Extra commands:', extra.join(', '));
    }
    process.exit(1);
  }
}

main();
