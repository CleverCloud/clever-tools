#!/usr/bin/env node

/**
 * Analyze options and arguments to show required/optional status and defaults.
 * Generates CSV files for easy analysis.
 */

import fs from 'fs';
import path from 'path';

// Read the analysis data from script 01
const dataPath = path.join(process.cwd(), 'analysis', 'data', '01-analyse-commands-arguments-options.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Helper to escape CSV values
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to format array as string
function formatArray(arr) {
  if (!arr || arr.length === 0) return '';
  return arr.join('; ');
}

// Generate OPTIONS CSV
function generateOptionsCSV() {
  const headers = [
    'name',
    'optsKey',
    'type',
    'required',
    'default',
    'metavar',
    'aliases',
    'parser',
    'has_complete',
    'helper',
    'commands_count',
    'description'
  ];

  const rows = data.options.map(opt => {
    return [
      opt.name,
      opt.optsKey,
      opt.type,
      opt.required === true ? 'true' : opt.required === false ? 'false' : '',
      opt.default !== null && opt.default !== undefined ? String(opt.default) : '',
      opt.metavar || '',
      formatArray(opt.aliases),
      opt.parser || '',
      opt.complete ? 'yes' : '',
      opt.helper || '',
      opt.commands ? opt.commands.length : 0,
      opt.description
    ].map(csvEscape).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Generate ARGUMENTS CSV
function generateArgumentsCSV() {
  const headers = [
    'name',
    'argsKey',
    'parser',
    'has_complete',
    'commands_count',
    'description'
  ];

  const rows = data.arguments.map(arg => {
    return [
      arg.name,
      arg.argsKey,
      arg.parser || '',
      arg.complete ? 'yes' : '',
      arg.commands ? arg.commands.length : 0,
      arg.description
    ].map(csvEscape).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Generate COMMANDS with their options/args CSV (flattened view)
function generateCommandsDetailCSV() {
  const headers = [
    'command_path',
    'type',  // option/argument
    'param_name',
    'param_key',
    'is_required',
    'default_value',
    'source'  // global, inherited, or own
  ];

  const rows = [];

  function processCommands(commands, parentPath = '') {
    for (const cmd of commands) {
      const cmdPath = parentPath ? `${parentPath}/${cmd.name}` : cmd.name;

      // Add arguments for this command
      if (cmd.args && cmd.args.length > 0) {
        for (const argKey of cmd.args) {
          const argDef = data.arguments.find(a => a.argsKey === argKey);
          if (argDef) {
            rows.push([
              cmdPath,
              'argument',
              argDef.name,
              argKey,
              'required',  // arguments are typically required
              '',
              'own'
            ].map(csvEscape).join(','));
          }
        }
      }

      // Add options for this command
      if (cmd.options && cmd.options.length > 0) {
        for (const optKey of cmd.options) {
          const optDef = data.options.find(o => o.optsKey === optKey);
          if (optDef) {
            const isGlobal = ['color', 'updateNotifier', 'verbose'].includes(optKey);
            rows.push([
              cmdPath,
              'option',
              optDef.name,
              optKey,
              optDef.required === true ? 'true' : optDef.required === false ? 'false' : '',
              optDef.default !== null && optDef.default !== undefined ? String(optDef.default) : '',
              isGlobal ? 'global' : 'own'
            ].map(csvEscape).join(','));
          }
        }
      }

      // Process subcommands recursively
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        processCommands(cmd.subcommands, cmdPath);
      }
    }
  }

  processCommands(data.commands);

  return [headers.join(','), ...rows].join('\n');
}

// Generate summary statistics
function generateSummary() {
  const stats = {
    totalOptions: data.options.length,
    optionsWithRequired: data.options.filter(o => o.required !== null).length,
    optionsRequired: data.options.filter(o => o.required === true).length,
    optionsNotRequired: data.options.filter(o => o.required === false).length,
    optionsWithDefault: data.options.filter(o => o.default !== null && o.default !== undefined).length,
    optionsFlags: data.options.filter(o => o.type === 'flag').length,
    optionsWithOption: data.options.filter(o => o.type === 'option').length,
    optionsWithHelper: data.options.filter(o => o.helper).length,
    optionsWithParser: data.options.filter(o => o.parser).length,
    optionsWithComplete: data.options.filter(o => o.complete).length,
    totalArguments: data.arguments.length,
    argumentsWithParser: data.arguments.filter(a => a.parser).length,
    argumentsWithComplete: data.arguments.filter(a => a.complete).length,
  };

  const lines = [
    '=== OPTIONS/ARGUMENTS ANALYSIS SUMMARY ===',
    '',
    '== OPTIONS ==',
    `Total options: ${stats.totalOptions}`,
    `  - Type 'flag': ${stats.optionsFlags}`,
    `  - Type 'option': ${stats.optionsWithOption}`,
    '',
    `Options with 'required' explicitly set: ${stats.optionsWithRequired}`,
    `  - required=true: ${stats.optionsRequired}`,
    `  - required=false: ${stats.optionsNotRequired}`,
    `  - NOT SET (null): ${stats.totalOptions - stats.optionsWithRequired}`,
    '',
    `Options with default value: ${stats.optionsWithDefault}`,
    `Options without default: ${stats.totalOptions - stats.optionsWithDefault}`,
    '',
    `Options using helper functions: ${stats.optionsWithHelper}`,
    `Options with parser: ${stats.optionsWithParser}`,
    `Options with complete function: ${stats.optionsWithComplete}`,
    '',
    '== ARGUMENTS ==',
    `Total arguments: ${stats.totalArguments}`,
    `Arguments with parser: ${stats.argumentsWithParser}`,
    `Arguments with complete function: ${stats.argumentsWithComplete}`,
    '',
    '== OPTIONS BY REQUIRED STATUS ==',
    '',
    'Options with required=true:',
    ...data.options.filter(o => o.required === true).map(o => `  - ${o.name} (${o.optsKey})`),
    '',
    'Options with required=null (not explicitly set):',
    ...data.options.filter(o => o.required === null || o.required === undefined).map(o => `  - ${o.name} (${o.optsKey}): default=${o.default !== null && o.default !== undefined ? JSON.stringify(o.default) : 'none'}`),
  ];

  return lines.join('\n');
}

// Write output files
const outputDir = path.join(process.cwd(), 'analysis', 'data');

const optionsCSV = generateOptionsCSV();
fs.writeFileSync(path.join(outputDir, '05-options.csv'), optionsCSV);
console.log(`Options CSV written: ${data.options.length} options`);

const argumentsCSV = generateArgumentsCSV();
fs.writeFileSync(path.join(outputDir, '05-arguments.csv'), argumentsCSV);
console.log(`Arguments CSV written: ${data.arguments.length} arguments`);

const commandsDetailCSV = generateCommandsDetailCSV();
fs.writeFileSync(path.join(outputDir, '05-commands-params.csv'), commandsDetailCSV);
console.log(`Commands params CSV written`);

const summary = generateSummary();
fs.writeFileSync(path.join(outputDir, '05-summary.txt'), summary);
console.log(`Summary written`);
console.log('\n' + summary);
