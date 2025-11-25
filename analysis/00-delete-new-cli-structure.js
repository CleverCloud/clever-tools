#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read the CLI structure analysis
const structurePath = path.join(process.cwd(), 'analysis', 'data', 'analyse-1-commands-arguments-options.json');
const structure = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));

// Helper function to convert to kebab-case
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to get command path
function getCommandPath(command, parentPath = '') {
  return parentPath ? `${parentPath}.${command.name}` : command.name;
}

// Helper function to get main command from path
function getMainCommand(commandPath) {
  return commandPath.split('.')[0];
}

// Collect all commands recursively
function collectAllCommands(commands, parentPath = '') {
  const allCommands = [];

  for (const command of commands) {
    const commandPath = getCommandPath(command, parentPath);
    allCommands.push({ ...command, commandPath });

    // Recursively collect subcommands
    if (command.subcommands) {
      allCommands.push(...collectAllCommands(command.subcommands, commandPath));
    }
  }

  return allCommands;
}

const allCommands = collectAllCommands(structure.commands);

// Collect all main commands
const mainCommands = new Set();
for (const command of allCommands) {
  const mainCommand = getMainCommand(command.commandPath);
  mainCommands.add(mainCommand);
}

// Delete files and directories
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠ Could not delete ${filePath}: ${error.message}`);
    return false;
  }
}

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      // Check if directory is empty
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✓ Deleted directory ${dirPath}`);
        return true;
      } else {
        console.warn(`⚠ Directory ${dirPath} is not empty, skipping deletion`);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.warn(`⚠ Could not delete directory ${dirPath}: ${error.message}`);
    return false;
  }
}

// Main execution
function main() {
  const baseDir = path.join(process.cwd(), 'src', 'commands');

  console.log('Deleting generated CLI structure files...');

  let deletedCount = 0;
  let skippedCount = 0;

  // Delete command files
  for (const command of allCommands) {
    const { commandPath } = command;
    const mainCommand = getMainCommand(commandPath);
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));

    const fileName = `${toKebabCase(commandPath)}.command.js`;
    const filePath = path.join(commandDir, fileName);

    if (deleteFile(filePath)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  }

  // Delete main command args files
  for (const mainCommand of mainCommands) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    const fileName = `${toKebabCase(mainCommand)}.args.js`;
    const filePath = path.join(commandDir, fileName);

    if (deleteFile(filePath)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  }

  // Delete main command opts files
  for (const mainCommand of mainCommands) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    const fileName = `${toKebabCase(mainCommand)}.opts.js`;
    const filePath = path.join(commandDir, fileName);

    if (deleteFile(filePath)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  }

  // Delete global files
  const globalFiles = ['global.args.js', 'global.opts.js', 'global.commands.js'];
  for (const fileName of globalFiles) {
    const filePath = path.join(baseDir, fileName);
    if (deleteFile(filePath)) {
      deletedCount++;
    } else {
      skippedCount++;
    }
  }

  // Delete main command directories (only if empty)
  console.log('\nDeleting empty directories...');
  let deletedDirs = 0;
  let skippedDirs = 0;

  for (const mainCommand of mainCommands) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    if (deleteDirectory(commandDir)) {
      deletedDirs++;
    } else {
      skippedDirs++;
    }
  }

  console.log('\nDeletion complete!');
  console.log(`Deleted ${deletedCount} files`);
  console.log(`Skipped ${skippedCount} files (already deleted or not found)`);
  console.log(`Deleted ${deletedDirs} directories`);
  console.log(`Skipped ${skippedDirs} directories (not empty or not found)`);
}

try {
  main();
} catch (error) {
  console.error('Error deleting CLI structure:', error.message);
  console.error(error.stack);
  process.exit(1);
}
