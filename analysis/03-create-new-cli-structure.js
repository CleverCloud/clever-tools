#!/usr/bin/env node

import { parse } from '@babel/parser';
import fs from 'fs';
import path from 'path';

// Read the CLI structure analysis
const structurePath = path.join(process.cwd(), 'analysis', 'data', '01-analyse-commands-arguments-options.json');
const structure = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));

// Read the commands usage analysis
const usagePath = path.join(process.cwd(), 'analysis', 'data', '02-analyse-commands-usage.json');
const commandsUsage = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));

// Build a lookup map for command usage: command name -> { importFile, importName, uses }
const usageByCommand = new Map();
for (const usage of commandsUsage) {
  usageByCommand.set(usage.command, usage);
}

// Helper function to convert to kebab-case
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to convert to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Helper function to get command path
function getCommandPath(command, parentPath = '') {
  return parentPath ? `${parentPath}.${command.name}` : command.name;
}

// Helper function to get main command from path
function getMainCommand(commandPath) {
  return commandPath.split('.')[0];
}

// Helper function to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper function to generate command export name
function getCommandExportName(commandPath) {
  return toCamelCase(commandPath.replace(/\./g, '-')) + 'Command';
}

// Helper function to generate arg/opt export name
function getArgOptExportName(name, type) {
  const suffix = type === 'arg' ? 'Arg' : 'Opt';
  return toCamelCase(name) + suffix;
}

// Helper function to escape quotes and special characters in strings
function escapeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Helper function to check if a name is a constant (UPPER_CASE)
function isConstant(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

// Build command usage mappings
const argUsage = new Map();
const optUsage = new Map();

// Collect all commands recursively
function collectAllCommands(commands, parentPath = '') {
  const allCommands = [];

  for (const command of commands) {
    const commandPath = getCommandPath(command, parentPath);
    allCommands.push({ ...command, commandPath });

    if (command.args) {
      for (const argKey of command.args) {
        if (!argUsage.has(argKey)) {
          argUsage.set(argKey, []);
        }
        argUsage.get(argKey).push(commandPath);
      }
    }

    if (command.options) {
      for (const optKey of command.options) {
        if (!optUsage.has(optKey)) {
          optUsage.set(optKey, []);
        }
        optUsage.get(optKey).push(commandPath);
      }
    }

    if (command.subcommands) {
      allCommands.push(...collectAllCommands(command.subcommands, commandPath));
    }
  }

  return allCommands;
}

const allCommands = collectAllCommands(structure.commands);

// Categorize args and options
function categorizeArgsAndOpts() {
  const categories = {
    inline: { args: new Set(), opts: new Set() },
    mainCommand: { args: new Map(), opts: new Map() },
    global: { args: new Set(), opts: new Set() },
  };

  for (const [argKey, commandPaths] of argUsage) {
    if (commandPaths.length === 1) {
      categories.inline.args.add(argKey);
    } else {
      const mainCommands = new Set(commandPaths.map(getMainCommand));
      if (mainCommands.size === 1) {
        const mainCommand = [...mainCommands][0];
        if (!categories.mainCommand.args.has(mainCommand)) {
          categories.mainCommand.args.set(mainCommand, new Set());
        }
        categories.mainCommand.args.get(mainCommand).add(argKey);
      } else {
        categories.global.args.add(argKey);
      }
    }
  }

  for (const [optKey, commandPaths] of optUsage) {
    if (commandPaths.length === 1) {
      categories.inline.opts.add(optKey);
    } else {
      const mainCommands = new Set(commandPaths.map(getMainCommand));
      if (mainCommands.size === 1) {
        const mainCommand = [...mainCommands][0];
        if (!categories.mainCommand.opts.has(mainCommand)) {
          categories.mainCommand.opts.set(mainCommand, new Set());
        }
        categories.mainCommand.opts.get(mainCommand).add(optKey);
      } else {
        categories.global.opts.add(optKey);
      }
    }
  }

  return categories;
}

const categories = categorizeArgsAndOpts();

// Create args and opts lookup maps
const argsLookup = new Map();
const optsLookup = new Map();

structure.arguments.forEach((arg) => {
  argsLookup.set(arg.argsKey, arg);
});

structure.options.forEach((opt) => {
  optsLookup.set(opt.optsKey, opt);
});

// Cache for parsed legacy files (AST + source)
const legacyFileCache = new Map();

// Parse a legacy file using Babel and cache the result
function parseLegacyFile(filePath) {
  if (legacyFileCache.has(filePath)) {
    return legacyFileCache.get(filePath);
  }

  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Legacy file not found: ${fullPath}`);
    return null;
  }

  const source = fs.readFileSync(fullPath, 'utf-8');

  let ast;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: [],
    });
  } catch (error) {
    console.warn(`Warning: Could not parse ${fullPath}: ${error.message}`);
    return null;
  }

  // Extract imports
  const imports = [];
  const declarations = new Map(); // name -> { type, start, end, exported, async }

  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      imports.push(source.slice(node.start, node.end));
    } else if (node.type === 'FunctionDeclaration') {
      declarations.set(node.id.name, {
        type: 'function',
        start: node.start,
        end: node.end,
        bodyStart: node.body.start,
        bodyEnd: node.body.end,
        exported: false,
        async: node.async,
        params: source
          .slice(node.params[0]?.start ?? node.id.end + 1, node.body.start)
          .trim()
          .replace(/\)\s*$/, ')'),
      });
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const decl = node.declaration;
      if (decl.type === 'FunctionDeclaration') {
        declarations.set(decl.id.name, {
          type: 'function',
          start: decl.start,
          end: decl.end,
          bodyStart: decl.body.start,
          bodyEnd: decl.body.end,
          exported: true,
          async: decl.async,
          params: source
            .slice(decl.id.end, decl.body.start)
            .trim()
            .replace(/\)\s*$/, ')'),
        });
      } else if (decl.type === 'VariableDeclaration') {
        for (const varDecl of decl.declarations) {
          const init = varDecl.init;
          if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
            declarations.set(varDecl.id.name, {
              type: 'function',
              start: varDecl.start,
              end: varDecl.end,
              bodyStart: init.body.start,
              bodyEnd: init.body.end,
              exported: true,
              async: init.async,
              params: source
                .slice(init.start, init.body.start)
                .replace(/^async\s*/, '')
                .replace(/\s*=>\s*$/, '')
                .trim(),
            });
          } else {
            declarations.set(varDecl.id.name, {
              type: 'const',
              start: varDecl.start,
              end: varDecl.end,
              exported: true,
              async: false,
            });
          }
        }
      }
    } else if (node.type === 'VariableDeclaration') {
      for (const varDecl of node.declarations) {
        const init = varDecl.init;
        if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
          declarations.set(varDecl.id.name, {
            type: 'function',
            start: varDecl.start,
            end: varDecl.end,
            bodyStart: init.body.start,
            bodyEnd: init.body.end,
            exported: false,
            async: init.async,
            params: source
              .slice(init.start, init.body.start)
              .replace(/^async\s*/, '')
              .replace(/\s*=>\s*$/, '')
              .trim(),
          });
        } else {
          declarations.set(varDecl.id.name, {
            type: 'const',
            start: varDecl.start,
            end: varDecl.end,
            exported: false,
            async: false,
          });
        }
      }
    } else if (node.type === 'ClassDeclaration') {
      declarations.set(node.id.name, {
        type: 'class',
        start: node.start,
        end: node.end,
        exported: false,
        async: false,
      });
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'ClassDeclaration') {
      const decl = node.declaration;
      declarations.set(decl.id.name, {
        type: 'class',
        start: decl.start,
        end: decl.end,
        exported: true,
        async: false,
      });
    }
  }

  const parsed = {
    source,
    ast,
    imports,
    declarations,
  };

  legacyFileCache.set(filePath, parsed);
  return parsed;
}

// Extract a declaration from parsed file by name
function extractDeclaration(parsed, name) {
  const decl = parsed.declarations.get(name);
  if (!decl) return null;

  let code = parsed.source.slice(decl.start, decl.end);

  // For const declarations, we need to add "const " prefix and semicolon
  // since AST gives us just the declarator (e.g., "FOO = 123" instead of "const FOO = 123;")
  if (decl.type === 'const') {
    code = 'const ' + code + ';';
  }

  return { type: decl.type, code };
}

// Extract function body info for inlining into command object
function extractFunctionBody(parsed, functionName) {
  const decl = parsed.declarations.get(functionName);
  if (!decl || decl.type !== 'function') return null;

  // Get the function body (content inside braces)
  const body = parsed.source.slice(decl.bodyStart + 1, decl.bodyEnd - 1).trim();

  return {
    isAsync: decl.async,
    params: decl.params,
    body,
  };
}

// Generate inline args/opts objects
function generateInlineArg(argKey) {
  const arg = argsLookup.get(argKey);
  if (!arg) return null;

  const argObj = {
    name: arg.name,
    description: escapeString(arg.description),
  };

  if (arg.parser) {
    argObj.parser = `${toCamelCase(arg.parser)}Parser`;
  } else {
    argObj.parser = null;
  }

  if (arg.complete !== undefined && arg.complete !== null) {
    if (typeof arg.complete === 'string') {
      argObj.complete = arg.complete;
    } else if (typeof arg.complete === 'object') {
      argObj.complete = { __functionRef: arg.complete.importName };
    }
  } else {
    argObj.complete = null;
  }

  return argObj;
}

function generateInlineOpt(optKey) {
  const opt = optsLookup.get(optKey);
  if (!opt) return null;

  const optObj = {
    name: opt.name,
    description: escapeString(opt.description),
    type: opt.type || 'option',
  };

  optObj.metavar = opt.metavar ? escapeString(opt.metavar) : null;
  optObj.aliases = opt.aliases && opt.aliases.length > 0 ? opt.aliases : null;
  optObj.default = opt.default !== undefined && opt.default !== null ? opt.default : null;
  optObj.required = opt.required || null;

  if (opt.parser) {
    optObj.parser = `${toCamelCase(opt.parser)}Parser`;
  } else {
    optObj.parser = null;
  }

  if (opt.complete !== undefined && opt.complete !== null) {
    if (typeof opt.complete === 'string') {
      optObj.complete = opt.complete;
    } else if (typeof opt.complete === 'object') {
      optObj.complete = { __functionRef: opt.complete.importName };
    }
  } else {
    optObj.complete = null;
  }

  return optObj;
}

// Get command name for usage lookup (convert path like "addon.create" to "addon create")
function getCommandNameForUsage(commandPath) {
  return commandPath.replace(/\./g, ' ');
}

// Generate command file content
function generateCommandFile(command) {
  const { commandPath } = command;
  const exportName = getCommandExportName(commandPath);
  const commandName = getCommandNameForUsage(commandPath);
  const usage = usageByCommand.get(commandName);

  // Collect inline args and options
  const inlineArgs = [];
  const inlineOpts = [];
  const importedArgs = [];
  const importedOpts = [];

  if (command.args) {
    for (const argKey of command.args) {
      if (categories.inline.args.has(argKey)) {
        const argObj = generateInlineArg(argKey);
        if (argObj) inlineArgs.push(argObj);
      } else {
        importedArgs.push(argKey);
      }
    }
  }

  if (command.options) {
    for (const optKey of command.options) {
      if (categories.inline.opts.has(optKey)) {
        const optObj = generateInlineOpt(optKey);
        if (optObj) inlineOpts.push(optObj);
      } else {
        importedOpts.push(optKey);
      }
    }
  }

  // Generate imports
  const imports = [];
  const parserImports = new Set();
  const completeImports = new Map();
  const mainCommand = getMainCommand(commandPath);

  // Get legacy file info and parse it using AST
  let legacyImports = [];
  let usesDeclarations = []; // All declarations in source order
  let executeInfo = null;

  if (usage && usage.importFile) {
    const parsed = parseLegacyFile(usage.importFile);

    if (parsed) {
      // Get imports from legacy file, adjusting relative paths
      legacyImports = parsed.imports.map((importStatement) => {
        let adjusted = importStatement;
        adjusted = adjusted.replace(/from\s+['"]\.\.\/src\/([^'"]*)['"]/g, "from '../../$1'");
        adjusted = adjusted.replace(/from\s+['"]\.\.\/([^/][^'"]*)['"]/g, "from '../../$1'");
        return adjusted;
      });

      // Extract execute function info using AST
      executeInfo = extractFunctionBody(parsed, usage.importName);

      // Extract declarations from uses, sorted by source position to preserve order
      if (usage.uses && usage.uses.length > 0) {
        const declarationsWithPosition = [];
        for (const useName of usage.uses) {
          const decl = parsed.declarations.get(useName);
          if (decl) {
            const declaration = extractDeclaration(parsed, useName);
            if (declaration) {
              // Remove export keyword if present
              let code = declaration.code;
              code = code.replace(/^export\s+/, '');
              declarationsWithPosition.push({ code, start: decl.start });
            }
          }
        }
        // Sort by source position to preserve original order
        declarationsWithPosition.sort((a, b) => a.start - b.start);
        usesDeclarations = declarationsWithPosition.map((d) => d.code);
      }
    }
  }

  // Collect parser imports and complete imports for inline args
  for (const argKey of command.args || []) {
    if (categories.inline.args.has(argKey)) {
      const arg = argsLookup.get(argKey);
      if (arg && arg.parser) {
        parserImports.add(`${arg.parser} as ${toCamelCase(arg.parser)}Parser`);
      }
      if (arg && arg.complete && typeof arg.complete === 'object') {
        const importFile = arg.complete.importFile;
        const importName = arg.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  // Collect parser imports and complete imports for inline opts
  for (const optKey of command.options || []) {
    if (categories.inline.opts.has(optKey)) {
      const opt = optsLookup.get(optKey);
      if (opt && opt.parser) {
        parserImports.add(`${opt.parser} as ${toCamelCase(opt.parser)}Parser`);
      }
      if (opt && opt.complete && typeof opt.complete === 'object') {
        const importFile = opt.complete.importFile;
        const importName = opt.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  // Import args from main command file
  const mainCommandArgs = categories.mainCommand.args.get(mainCommand);
  const mainCommandImportedArgs = importedArgs.filter((argKey) => mainCommandArgs && mainCommandArgs.has(argKey));

  if (mainCommandImportedArgs.length > 0) {
    const argImports = mainCommandImportedArgs.map((argKey) => getArgOptExportName(argKey, 'arg'));
    imports.push(`import { ${argImports.join(', ')} } from './${toKebabCase(mainCommand)}.args.js';`);
  }

  // Import args from global file
  const globalImportedArgs = importedArgs.filter((argKey) => categories.global.args.has(argKey));

  if (globalImportedArgs.length > 0) {
    const argImports = globalImportedArgs.map((argKey) => getArgOptExportName(argKey, 'arg'));
    imports.push(`import { ${argImports.join(', ')} } from '../global.args.js';`);
  }

  // Import opts from main command file
  const mainCommandOpts = categories.mainCommand.opts.get(mainCommand);
  const mainCommandImportedOpts = importedOpts.filter((optKey) => mainCommandOpts && mainCommandOpts.has(optKey));

  if (mainCommandImportedOpts.length > 0) {
    const optImports = mainCommandImportedOpts.map((optKey) => getArgOptExportName(optKey, 'opt'));
    imports.push(`import { ${optImports.join(', ')} } from './${toKebabCase(mainCommand)}.opts.js';`);
  }

  // Import opts from global file
  const globalImportedOpts = importedOpts.filter((optKey) => categories.global.opts.has(optKey));

  if (globalImportedOpts.length > 0) {
    const optImports = globalImportedOpts.map((optKey) => getArgOptExportName(optKey, 'opt'));
    imports.push(`import { ${optImports.join(', ')} } from '../global.opts.js';`);
  }

  // Add parser imports if any
  if (parserImports.size > 0) {
    const sortedParserImports = Array.from(parserImports).sort();
    imports.push(`import { ${sortedParserImports.join(', ')} } from '../../parsers.js';`);
  }

  // Add complete function imports if any
  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../../${cleanImportFile}`;
      imports.push(`import { ${sortedNames.join(', ')} } from '${relativePath}';`);
    }
  }

  // Add legacy imports
  imports.push(...legacyImports);

  // Build args array
  const argsArray = [
    ...inlineArgs,
    ...mainCommandImportedArgs.map((argKey) => getArgOptExportName(argKey, 'arg')),
    ...globalImportedArgs.map((argKey) => getArgOptExportName(argKey, 'arg')),
  ];

  // Build opts array
  const optsArray = [
    ...inlineOpts,
    ...mainCommandImportedOpts.map((optKey) => getArgOptExportName(optKey, 'opt')),
    ...globalImportedOpts.map((optKey) => getArgOptExportName(optKey, 'opt')),
  ];

  // Generate content
  let content = '';

  // 1. Imports
  if (imports.length > 0) {
    content += imports.join('\n') + '\n';
  }

  // 2. Empty line
  content += '\n';

  // 3. All "uses" declarations BEFORE command object
  // Keep original source order to preserve dependencies
  if (usesDeclarations.length > 0) {
    content += usesDeclarations.join('\n\n') + '\n';
    content += '\n';
  }

  // 4. Command object with inlined execute
  content += `export const ${exportName} = {\n`;
  content += `  name: '${escapeString(command.name)}',\n`;
  content += `  description: '${escapeString(command.description)}',\n`;
  content += `  experimental: ${command.experimental ? 'true' : 'false'},\n`;
  content += `  featureFlag: ${command.featureFlag ? `'${escapeString(command.featureFlag)}'` : 'null'},\n`;

  // Options
  if (optsArray.length > 0) {
    content += `  opts: {\n`;
    optsArray.forEach((opt, index) => {
      let optName;
      if (typeof opt === 'string') {
        const optKey = importedOpts.find((key) => getArgOptExportName(key, 'opt') === opt);
        if (optKey) {
          const optData = optsLookup.get(optKey);
          optName = optData ? optData.name : 'unknown';
        } else {
          optName = 'unknown';
        }
        const quotedOptName = optName.includes('-') ? `'${optName}'` : optName;
        content += `    ${quotedOptName}: ${opt}`;
      } else {
        optName = opt.name;
        const quotedOptName = optName.includes('-') ? `'${optName}'` : optName;
        content += `    ${quotedOptName}: {\n`;
        content += `      name: '${escapeString(opt.name)}',\n`;
        content += `      description: '${opt.description}',\n`;
        content += `      type: '${opt.type || 'option'}'`;
        content += `,\n      metavar: ${opt.metavar !== null ? `'${opt.metavar}'` : 'null'}`;
        content += `,\n      aliases: ${opt.aliases !== null && opt.aliases.length > 0 ? `[${opt.aliases.map((a) => `'${a}'`).join(', ')}]` : 'null'}`;
        content += `,\n      default: ${opt.default !== null ? (typeof opt.default === 'string' ? `'${escapeString(opt.default)}'` : opt.default) : 'null'}`;
        content += `,\n      required: ${opt.required !== null ? opt.required : 'null'}`;
        content += `,\n      parser: ${opt.parser !== null ? opt.parser : 'null'}`;
        if (opt.complete !== undefined) {
          if (opt.complete === null) {
            content += `,\n      complete: null`;
          } else if (typeof opt.complete === 'string') {
            content += `,\n      complete: '${escapeString(opt.complete)}'`;
          } else if (opt.complete && opt.complete.__functionRef) {
            content += `,\n      complete: ${opt.complete.__functionRef}`;
          }
        }
        content += `\n    }`;
      }
      content += index < optsArray.length - 1 ? ',\n' : '\n';
    });
    content += `  },\n`;
  } else {
    content += `  opts: {},\n`;
  }

  // Args
  if (argsArray.length > 0) {
    content += `  args: [\n`;
    argsArray.forEach((arg) => {
      if (typeof arg === 'string') {
        content += `    ${arg},\n`;
      } else {
        content += `    {\n`;
        content += `      name: '${escapeString(arg.name)}',\n`;
        content += `      description: '${arg.description}'`;
        content += `,\n      parser: ${arg.parser !== null ? arg.parser : 'null'}`;
        if (arg.complete !== undefined) {
          if (arg.complete === null) {
            content += `,\n      complete: null`;
          } else if (typeof arg.complete === 'string') {
            content += `,\n      complete: '${escapeString(arg.complete)}'`;
          } else if (arg.complete && arg.complete.__functionRef) {
            content += `,\n      complete: ${arg.complete.__functionRef}`;
          }
        }
        content += `\n    },\n`;
      }
    });
    content += `  ],\n`;
  } else {
    content += `  args: [],\n`;
  }

  // Execute function (inlined)
  if (executeInfo) {
    const asyncKeyword = executeInfo.isAsync ? 'async ' : '';
    content += `  ${asyncKeyword}execute${executeInfo.params} {\n`;
    // Indent the body
    const bodyLines = executeInfo.body.split('\n');
    for (const line of bodyLines) {
      content += `    ${line}\n`;
    }
    content += `  }\n`;
  } else {
    content += `  execute: null\n`;
  }

  content += `};\n`;

  return content;
}

// Generate args file content
function generateArgsFile(mainCommand) {
  const argKeys = categories.mainCommand.args.get(mainCommand);
  if (!argKeys || argKeys.size === 0) return null;

  const parserImports = new Set();
  const completeImports = new Map();
  const argData = [];

  for (const argKey of argKeys) {
    const arg = argsLookup.get(argKey);
    if (arg) {
      argData.push({ argKey, arg });
      if (arg.parser) {
        parserImports.add(`${arg.parser} as ${toCamelCase(arg.parser)}Parser`);
      }
      if (arg.complete && typeof arg.complete === 'object') {
        const importFile = arg.complete.importFile;
        const importName = arg.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  let content = '';

  if (parserImports.size > 0) {
    const sortedImports = Array.from(parserImports).sort();
    content += `import { ${sortedImports.join(', ')} } from '../../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  if (parserImports.size > 0 || completeImports.size > 0) {
    content += '\n';
  }

  for (const { argKey, arg } of argData) {
    const exportName = getArgOptExportName(argKey, 'arg');
    content += `export const ${exportName} = {\n`;
    content += `  name: '${escapeString(arg.name)}',\n`;
    content += `  description: '${escapeString(arg.description)}'`;
    content += `,\n  parser: ${arg.parser ? `${toCamelCase(arg.parser)}Parser` : 'null'}`;

    if (arg.complete !== undefined && arg.complete !== null) {
      if (typeof arg.complete === 'string') {
        content += `,\n  complete: '${escapeString(arg.complete)}'`;
      } else if (typeof arg.complete === 'object') {
        content += `,\n  complete: ${arg.complete.importName}`;
      }
    } else {
      content += `,\n  complete: null`;
    }

    content += `\n};\n\n`;
  }

  return content;
}

// Generate opts file content
function generateOptsFile(mainCommand) {
  const optKeys = categories.mainCommand.opts.get(mainCommand);
  if (!optKeys || optKeys.size === 0) return null;

  const parserImports = new Set();
  const completeImports = new Map();
  const optData = [];

  for (const optKey of optKeys) {
    const opt = optsLookup.get(optKey);
    if (opt) {
      optData.push({ optKey, opt });
      if (opt.parser) {
        parserImports.add(`${opt.parser} as ${toCamelCase(opt.parser)}Parser`);
      }
      if (opt.complete && typeof opt.complete === 'object') {
        const importFile = opt.complete.importFile;
        const importName = opt.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  let content = '';

  if (parserImports.size > 0) {
    const sortedImports = Array.from(parserImports).sort();
    content += `import { ${sortedImports.join(', ')} } from '../../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  if (parserImports.size > 0 || completeImports.size > 0) {
    content += '\n';
  }

  for (const { optKey, opt } of optData) {
    const exportName = getArgOptExportName(optKey, 'opt');
    content += `export const ${exportName} = {\n`;
    content += `  name: '${escapeString(opt.name)}',\n`;
    content += `  description: '${escapeString(opt.description)}',\n`;
    content += `  type: '${opt.type || 'option'}'`;
    content += `,\n  metavar: ${opt.metavar ? `'${escapeString(opt.metavar)}'` : 'null'}`;
    content += `,\n  aliases: ${opt.aliases && opt.aliases.length > 0 ? `[${opt.aliases.map((a) => `'${escapeString(a)}'`).join(', ')}]` : 'null'}`;
    content += `,\n  default: ${opt.default !== undefined && opt.default !== null ? (typeof opt.default === 'string' ? `'${escapeString(opt.default)}'` : opt.default) : 'null'}`;
    content += `,\n  required: ${opt.required ? 'true' : 'null'}`;
    content += `,\n  parser: ${opt.parser ? `${toCamelCase(opt.parser)}Parser` : 'null'}`;

    if (opt.complete !== undefined && opt.complete !== null) {
      if (typeof opt.complete === 'string') {
        content += `,\n  complete: '${escapeString(opt.complete)}'`;
      } else if (typeof opt.complete === 'object') {
        content += `,\n  complete: ${opt.complete.importName}`;
      }
    } else {
      content += `,\n  complete: null`;
    }

    content += `\n};\n\n`;
  }

  return content;
}

// Generate global args file content
function generateGlobalArgsFile() {
  if (categories.global.args.size === 0) return null;

  const parserImports = new Set();
  const completeImports = new Map();
  const argData = [];

  for (const argKey of categories.global.args) {
    const arg = argsLookup.get(argKey);
    if (arg) {
      argData.push({ argKey, arg });
      if (arg.parser) {
        parserImports.add(`${arg.parser} as ${toCamelCase(arg.parser)}Parser`);
      }
      if (arg.complete && typeof arg.complete === 'object') {
        const importFile = arg.complete.importFile;
        const importName = arg.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  let content = '';

  if (parserImports.size > 0) {
    const sortedImports = Array.from(parserImports).sort();
    content += `import { ${sortedImports.join(', ')} } from '../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  if (parserImports.size > 0 || completeImports.size > 0) {
    content += '\n';
  }

  for (const { argKey, arg } of argData) {
    const exportName = getArgOptExportName(argKey, 'arg');
    content += `export const ${exportName} = {\n`;
    content += `  name: '${escapeString(arg.name)}',\n`;
    content += `  description: '${escapeString(arg.description)}'`;
    content += `,\n  parser: ${arg.parser ? `${toCamelCase(arg.parser)}Parser` : 'null'}`;

    if (arg.complete !== undefined && arg.complete !== null) {
      if (typeof arg.complete === 'string') {
        content += `,\n  complete: '${escapeString(arg.complete)}'`;
      } else if (typeof arg.complete === 'object') {
        content += `,\n  complete: ${arg.complete.importName}`;
      }
    } else {
      content += `,\n  complete: null`;
    }

    content += `\n};\n\n`;
  }

  return content;
}

// Generate global opts file content
function generateGlobalOptsFile() {
  if (categories.global.opts.size === 0) return null;

  const parserImports = new Set();
  const completeImports = new Map();
  const optData = [];

  for (const optKey of categories.global.opts) {
    const opt = optsLookup.get(optKey);
    if (opt) {
      optData.push({ optKey, opt });
      if (opt.parser) {
        parserImports.add(`${opt.parser} as ${toCamelCase(opt.parser)}Parser`);
      }
      if (opt.complete && typeof opt.complete === 'object') {
        const importFile = opt.complete.importFile;
        const importName = opt.complete.importName;
        if (!completeImports.has(importFile)) {
          completeImports.set(importFile, new Set());
        }
        completeImports.get(importFile).add(importName);
      }
    }
  }

  let content = '';

  if (parserImports.size > 0) {
    const sortedImports = Array.from(parserImports).sort();
    content += `import { ${sortedImports.join(', ')} } from '../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  if (parserImports.size > 0 || completeImports.size > 0) {
    content += '\n';
  }

  for (const { optKey, opt } of optData) {
    const exportName = getArgOptExportName(optKey, 'opt');
    content += `export const ${exportName} = {\n`;
    content += `  name: '${escapeString(opt.name)}',\n`;
    content += `  description: '${escapeString(opt.description)}',\n`;
    content += `  type: '${opt.type || 'option'}'`;
    content += `,\n  metavar: ${opt.metavar ? `'${escapeString(opt.metavar)}'` : 'null'}`;
    content += `,\n  aliases: ${opt.aliases && opt.aliases.length > 0 ? `[${opt.aliases.map((a) => `'${escapeString(a)}'`).join(', ')}]` : 'null'}`;
    content += `,\n  default: ${opt.default !== undefined && opt.default !== null ? (typeof opt.default === 'string' ? `'${escapeString(opt.default)}'` : opt.default) : 'null'}`;
    content += `,\n  required: ${opt.required ? 'true' : 'null'}`;
    content += `,\n  parser: ${opt.parser ? `${toCamelCase(opt.parser)}Parser` : 'null'}`;

    if (opt.complete !== undefined && opt.complete !== null) {
      if (typeof opt.complete === 'string') {
        content += `,\n  complete: '${escapeString(opt.complete)}'`;
      } else if (typeof opt.complete === 'object') {
        content += `,\n  complete: ${opt.complete.importName}`;
      }
    } else {
      content += `,\n  complete: null`;
    }

    content += `\n};\n\n`;
  }

  return content;
}

// Generate global commands hierarchy
function generateGlobalCommandsFile() {
  const imports = new Set();

  function buildHierarchy(commands, parentPath = '') {
    const hierarchy = {};

    for (const command of commands) {
      const commandPath = getCommandPath(command, parentPath);
      const exportName = getCommandExportName(commandPath);
      const mainCommand = getMainCommand(commandPath);

      const importPath = `./${toKebabCase(mainCommand)}/${toKebabCase(commandPath)}.command.js`;
      imports.add(`import { ${exportName} } from '${importPath}';`);

      const key = command.name.includes('-') || command.name.includes(' ') ? `'${command.name}'` : command.name;

      if (command.subcommands && command.subcommands.length > 0) {
        const subHierarchy = buildHierarchy(command.subcommands, commandPath);
        hierarchy[key] = [exportName, subHierarchy];
      } else {
        hierarchy[key] = exportName;
      }
    }

    return hierarchy;
  }

  const hierarchy = buildHierarchy(structure.commands);

  let content = '';

  const sortedImports = Array.from(imports).sort();
  content += sortedImports.join('\n') + '\n\n';

  content += 'export const globalCommands = {\n';

  function writeHierarchy(obj, indent = '  ') {
    const keys = Object.keys(obj).sort((a, b) => {
      const cleanA = a.replace(/'/g, '');
      const cleanB = b.replace(/'/g, '');
      return cleanA.localeCompare(cleanB);
    });

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = obj[key];

      content += `${indent}${key}: `;

      if (Array.isArray(value)) {
        const [mainCmd, subCommands] = value;
        if (Object.keys(subCommands).length > 0) {
          content += `[${mainCmd}, {\n`;
          writeHierarchy(subCommands, indent + '  ');
          content += `${indent}}]`;
        } else {
          content += mainCmd;
        }
      } else if (typeof value === 'string') {
        content += value;
      } else {
        content += '{\n';
        writeHierarchy(value, indent + '  ');
        content += `${indent}}`;
      }

      if (i < keys.length - 1) {
        content += ',';
      }
      content += '\n';
    }
  }

  writeHierarchy(hierarchy);

  content += '};\n';

  return content;
}

// Main execution
function main() {
  const baseDir = path.join(process.cwd(), 'src', 'commands');
  ensureDir(baseDir);

  console.log('Generating new CLI structure...');

  // Generate command files
  for (const command of allCommands) {
    const { commandPath } = command;
    const mainCommand = getMainCommand(commandPath);
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    ensureDir(commandDir);

    const fileName = `${toKebabCase(commandPath)}.command.js`;
    const filePath = path.join(commandDir, fileName);
    const content = generateCommandFile(command);

    fs.writeFileSync(filePath, content);
    console.log(`✓ Generated ${filePath}`);
  }

  // Generate main command args files
  for (const [mainCommand, argKeys] of categories.mainCommand.args) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    ensureDir(commandDir);

    const fileName = `${toKebabCase(mainCommand)}.args.js`;
    const filePath = path.join(commandDir, fileName);
    const content = generateArgsFile(mainCommand);

    if (content) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Generated ${filePath}`);
    }
  }

  // Generate main command opts files
  for (const [mainCommand, optKeys] of categories.mainCommand.opts) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    ensureDir(commandDir);

    const fileName = `${toKebabCase(mainCommand)}.opts.js`;
    const filePath = path.join(commandDir, fileName);
    const content = generateOptsFile(mainCommand);

    if (content) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Generated ${filePath}`);
    }
  }

  // Generate global args file
  const globalArgsContent = generateGlobalArgsFile();
  if (globalArgsContent) {
    const filePath = path.join(baseDir, 'global.args.js');
    fs.writeFileSync(filePath, globalArgsContent);
    console.log(`✓ Generated ${filePath}`);
  }

  // Generate global opts file
  const globalOptsContent = generateGlobalOptsFile();
  if (globalOptsContent) {
    const filePath = path.join(baseDir, 'global.opts.js');
    fs.writeFileSync(filePath, globalOptsContent);
    console.log(`✓ Generated ${filePath}`);
  }

  // Generate global commands file
  const globalCommandsContent = generateGlobalCommandsFile();
  if (globalCommandsContent) {
    const filePath = path.join(baseDir, 'global.commands.js');
    fs.writeFileSync(filePath, globalCommandsContent);
    console.log(`✓ Generated ${filePath}`);
  }

  console.log('\nGeneration complete!');
  console.log(`Generated ${allCommands.length} command files`);
  console.log(`Generated ${categories.mainCommand.args.size} main command args files`);
  console.log(`Generated ${categories.mainCommand.opts.size} main command opts files`);
  console.log(`Generated ${categories.global.args.size > 0 ? 1 : 0} global args file`);
  console.log(`Generated ${categories.global.opts.size > 0 ? 1 : 0} global opts file`);
  console.log(`Generated 1 global commands file`);
}

try {
  main();
} catch (error) {
  console.error('Error generating CLI structure:', error.message);
  console.error(error.stack);
  process.exit(1);
}
