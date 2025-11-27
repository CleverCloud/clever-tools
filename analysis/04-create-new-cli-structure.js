#!/usr/bin/env node

import { parse } from '@babel/parser';
import fs from 'fs';
import { execSync } from 'node:child_process';
import path from 'path';

// Read the CLI structure analysis
const structurePath = path.join(process.cwd(), 'analysis', 'data', '01-analyse-commands-arguments-options.json');
const structure = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));

// Read the commands usage analysis
const usagePath = path.join(process.cwd(), 'analysis', 'data', '03-analyse-commands-usage.json');
const commandsUsage = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));

// Build a lookup map for command usage: command name -> { importFile, importName, uses }
const usageByCommand = new Map();
for (const usage of commandsUsage) {
  usageByCommand.set(usage.command, usage);
}

// CLI-level global flags that are handled at the root CLI level, not per-command
// These should not be added to individual command definitions
// Note: flagKey uses camelCase (matching the analysis data), not kebab-case
const CLI_LEVEL_FLAGS = new Set(['color', 'updateNotifier', 'verbose']);

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

// Helper function to generate arg/flag export name
function getArgFlagExportName(name, type) {
  const suffix = type === 'arg' ? 'Arg' : 'Flag';
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
const flagUsage = new Map();

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
      for (const flagKey of command.options) {
        // Skip CLI-level flags - they're handled at root level, not per-command
        if (CLI_LEVEL_FLAGS.has(flagKey)) {
          continue;
        }
        if (!flagUsage.has(flagKey)) {
          flagUsage.set(flagKey, []);
        }
        flagUsage.get(flagKey).push(commandPath);
      }
    }

    if (command.subcommands) {
      allCommands.push(...collectAllCommands(command.subcommands, commandPath));
    }
  }

  return allCommands;
}

const allCommands = collectAllCommands(structure.commands);

// Categorize args and flags
function categorizeArgsAndFlags() {
  const categories = {
    inline: { args: new Set(), flags: new Set() },
    mainCommand: { args: new Map(), flags: new Map() },
    global: { args: new Set(), flags: new Set() },
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

  for (const [flagKey, commandPaths] of flagUsage) {
    if (commandPaths.length === 1) {
      categories.inline.flags.add(flagKey);
    } else {
      const mainCommands = new Set(commandPaths.map(getMainCommand));
      if (mainCommands.size === 1) {
        const mainCommand = [...mainCommands][0];
        if (!categories.mainCommand.flags.has(mainCommand)) {
          categories.mainCommand.flags.set(mainCommand, new Set());
        }
        categories.mainCommand.flags.get(mainCommand).add(flagKey);
      } else {
        categories.global.flags.add(flagKey);
      }
    }
  }

  return categories;
}

const categories = categorizeArgsAndFlags();

// Create args and flags lookup maps
const argsLookup = new Map();
const flagsLookup = new Map();

structure.arguments.forEach((arg) => {
  argsLookup.set(arg.argsKey, arg);
});

structure.options.forEach((flag) => {
  flagsLookup.set(flag.optsKey, flag);
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

// Generate inline args/flags objects
// Convert old parser to Zod schema string for arguments
function parserToZodSchemaForArg(arg) {
  const { parser } = arg;

  let baseSchema;
  let parserImport = null;

  switch (parser) {
    case 'integer':
      baseSchema = 'z.coerce.number().int()';
      break;
    case 'email':
      baseSchema = 'z.string().email()';
      break;
    // Custom parsers - use .transform() to apply at parse time
    case 'addonIdOrName':
      baseSchema = 'z.string().transform(addonIdOrName)';
      parserImport = 'addonIdOrName';
      break;
    case 'appIdOrName':
      baseSchema = 'z.string().transform(appIdOrName)';
      parserImport = 'appIdOrName';
      break;
    case 'orgaIdOrName':
      baseSchema = 'z.string().transform(orgaIdOrName)';
      parserImport = 'orgaIdOrName';
      break;
    case 'ngResourceType':
      baseSchema = 'z.string().transform(ngResourceType)';
      parserImport = 'ngResourceType';
      break;
    default:
      baseSchema = 'z.string()';
  }

  // Arguments are typically required (no default), but can check description for "optional"
  const descLower = (arg.description || '').toLowerCase();
  if (descLower.includes('optional')) {
    baseSchema = `${baseSchema}.optional()`;
  }

  return { schema: baseSchema, parserImport };
}

function generateInlineArg(argKey) {
  const arg = argsLookup.get(argKey);
  if (!arg) return null;

  const { schema, parserImport } = parserToZodSchemaForArg(arg);

  const argObj = {
    placeholder: arg.name, // Use name as placeholder (e.g., 'addon-id')
    schema,
    parserImport,
    description: escapeString(arg.description),
  };

  // Handle complete - convert to function reference
  if (arg.complete !== undefined && arg.complete !== null) {
    if (typeof arg.complete === 'string') {
      // Parse string like "cliparse.autocomplete.words(...)" into something useful
      const parsed = parseStringCompletion(arg.complete);
      if (parsed) {
        argObj.complete = { __functionRef: parsed.importName, __importInfo: parsed };
      } else {
        argObj.complete = arg.complete;
      }
    } else if (typeof arg.complete === 'object') {
      argObj.complete = { __functionRef: arg.complete.importName, __importInfo: arg.complete };
    }
  } else {
    argObj.complete = null;
  }

  return argObj;
}

// Convert old parser/type/default to Zod schema string
function parserToZodSchema(flag) {
  const { type, parser, default: defaultValue, required } = flag;

  // Boolean flags
  if (type === 'flag') {
    return {
      schema: defaultValue === true ? 'z.boolean().default(true)' : 'z.boolean().default(false)',
      parserImport: null,
    };
  }

  // String options with specific parsers
  let baseSchema;
  let parserImport = null;

  switch (parser) {
    case 'integer':
      baseSchema = 'z.coerce.number().int()';
      break;
    case 'instances':
      baseSchema = 'z.coerce.number().int().positive()';
      break;
    case 'commaSeparated':
      baseSchema = 'z.string().transform(v => v.split(","))';
      break;
    // Custom parsers - use .transform() to apply at parse time
    case 'date':
      baseSchema = 'z.string().transform(date)';
      parserImport = 'date';
      break;
    case 'futureDateOrDuration':
      baseSchema = 'z.string().transform(futureDateOrDuration)';
      parserImport = 'futureDateOrDuration';
      break;
    case 'appIdOrName':
      baseSchema = 'z.string().transform(appIdOrName)';
      parserImport = 'appIdOrName';
      break;
    case 'addonIdOrName':
      baseSchema = 'z.string().transform(addonIdOrName)';
      parserImport = 'addonIdOrName';
      break;
    case 'orgaIdOrName':
      baseSchema = 'z.string().transform(orgaIdOrName)';
      parserImport = 'orgaIdOrName';
      break;
    case 'email':
      baseSchema = 'z.string().email()';
      break;
    case 'flavor':
      baseSchema = 'z.string().transform(flavor)';
      parserImport = 'flavor';
      break;
    case 'buildFlavor':
      baseSchema = 'z.string().transform(buildFlavor)';
      parserImport = 'buildFlavor';
      break;
    case 'ngResourceType':
      baseSchema = 'z.string().transform(ngResourceType)';
      parserImport = 'ngResourceType';
      break;
    case 'addonOptions':
      baseSchema = 'z.string().transform(addonOptions)';
      parserImport = 'addonOptions';
      break;
    default:
      baseSchema = 'z.string()';
  }

  // Apply default or optional
  if (defaultValue !== null && defaultValue !== undefined) {
    const defaultStr = typeof defaultValue === 'string' ? `'${escapeString(defaultValue)}'` : defaultValue;
    baseSchema = `${baseSchema}.default(${defaultStr})`;
  } else if (!required) {
    baseSchema = `${baseSchema}.optional()`;
  }

  return { schema: baseSchema, parserImport };
}

// Parse string completion like "git.completeBranches()" into import info
function parseStringCompletion(completeStr) {
  // Match patterns like "git.completeBranches()" or "application.listAvailableAliases()"
  const match = completeStr.match(/^(\w+)\.(\w+)\(\)$/);
  if (match) {
    const [, moduleName, functionName] = match;
    return {
      importFile: `src/models/${moduleName}.js`,
      importName: functionName,
    };
  }
  return null;
}

function generateInlineFlag(flagKey) {
  const flag = flagsLookup.get(flagKey);
  if (!flag) return null;

  const { schema, parserImport } = parserToZodSchema(flag);

  const flagObj = {
    name: flag.name, // Used for the object key, not in defineFlag
    schema,
    parserImport,
    description: escapeString(flag.description),
  };

  // placeholder (was metavar)
  flagObj.placeholder = flag.metavar ? escapeString(flag.metavar) : null;
  flagObj.aliases = flag.aliases && flag.aliases.length > 0 ? flag.aliases : null;

  // Handle complete - convert to function reference
  if (flag.complete !== undefined && flag.complete !== null) {
    if (typeof flag.complete === 'string') {
      // Parse string like "git.completeBranches()" into import info
      const parsed = parseStringCompletion(flag.complete);
      if (parsed) {
        flagObj.complete = { __functionRef: parsed.importName, __importInfo: parsed };
      } else {
        // Keep as string if we can't parse it
        flagObj.complete = flag.complete;
      }
    } else if (typeof flag.complete === 'object') {
      flagObj.complete = { __functionRef: flag.complete.importName, __importInfo: flag.complete };
    }
  } else {
    flagObj.complete = null;
  }

  return flagObj;
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

  // Track if we need defineCommand import
  const needsDefineCommand = true;

  // Collect inline args and flags
  const inlineArgs = [];
  const inlineFlags = [];
  const importedArgs = [];
  const importedFlags = [];

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
    for (const flagKey of command.options) {
      // Skip CLI-level flags - they're handled at root level, not per-command
      if (CLI_LEVEL_FLAGS.has(flagKey)) {
        continue;
      }
      if (categories.inline.flags.has(flagKey)) {
        const flagObj = generateInlineFlag(flagKey);
        if (flagObj) inlineFlags.push(flagObj);
      } else {
        importedFlags.push(flagKey);
      }
    }
  }

  // Generate imports
  const imports = [];
  const parserImports = new Set();
  const completeImports = new Map();
  const mainCommand = getMainCommand(commandPath);

  // Add defineCommand import
  if (needsDefineCommand) {
    imports.push(`import { defineCommand } from '../../lib/define-command.js';`);
  }

  // Add defineArgument import if we have inline args
  if (inlineArgs.length > 0) {
    imports.push(`import { defineArgument } from '../../lib/define-argument.js';`);
  }

  // Add defineFlag import if we have inline flags
  if (inlineFlags.length > 0) {
    imports.push(`import { defineFlag } from '../../lib/define-flag.js';`);
  }

  // Add zod import if we have inline flags or inline args (for schema definitions)
  if (inlineFlags.length > 0 || inlineArgs.length > 0) {
    imports.push(`import { z } from 'zod';`);
  }

  // Get legacy file info and parse it using AST
  let legacyImports = [];
  let usesDeclarations = []; // All declarations in source order
  let handlerInfo = null;

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

      // Extract handler function info using AST (was called execute in old structure)
      handlerInfo = extractFunctionBody(parsed, usage.importName);

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

  // Collect complete imports for inline args (parsers are now handled via Zod schemas in generateInlineArg)
  for (const inlineArg of inlineArgs) {
    if (inlineArg.complete && inlineArg.complete.__importInfo) {
      const { importFile, importName } = inlineArg.complete.__importInfo;
      if (!completeImports.has(importFile)) {
        completeImports.set(importFile, new Set());
      }
      completeImports.get(importFile).add(importName);
    }
  }

  // Collect complete imports for inline flags (parsers are now handled via Zod schemas)
  for (const inlineFlag of inlineFlags) {
    if (inlineFlag.complete && inlineFlag.complete.__importInfo) {
      const { importFile, importName } = inlineFlag.complete.__importInfo;
      if (!completeImports.has(importFile)) {
        completeImports.set(importFile, new Set());
      }
      completeImports.get(importFile).add(importName);
    }
  }

  // Collect parser imports from inline args and flags
  for (const inlineArg of inlineArgs) {
    if (inlineArg.parserImport) {
      parserImports.add(inlineArg.parserImport);
    }
  }
  for (const inlineFlag of inlineFlags) {
    if (inlineFlag.parserImport) {
      parserImports.add(inlineFlag.parserImport);
    }
  }

  // Import args from main command file
  const mainCommandArgs = categories.mainCommand.args.get(mainCommand);
  const mainCommandImportedArgs = importedArgs.filter((argKey) => mainCommandArgs && mainCommandArgs.has(argKey));

  if (mainCommandImportedArgs.length > 0) {
    const argImports = mainCommandImportedArgs.map((argKey) => getArgFlagExportName(argKey, 'arg'));
    imports.push(`import { ${argImports.join(', ')} } from './${toKebabCase(mainCommand)}.args.js';`);
  }

  // Import args from global file
  const globalImportedArgs = importedArgs.filter((argKey) => categories.global.args.has(argKey));

  if (globalImportedArgs.length > 0) {
    const argImports = globalImportedArgs.map((argKey) => getArgFlagExportName(argKey, 'arg'));
    imports.push(`import { ${argImports.join(', ')} } from '../global.args.js';`);
  }

  // Import flags from main command file
  const mainCommandFlags = categories.mainCommand.flags.get(mainCommand);
  const mainCommandImportedFlags = importedFlags.filter((flagKey) => mainCommandFlags && mainCommandFlags.has(flagKey));

  if (mainCommandImportedFlags.length > 0) {
    const flagImports = mainCommandImportedFlags.map((flagKey) => getArgFlagExportName(flagKey, 'flag'));
    imports.push(`import { ${flagImports.join(', ')} } from './${toKebabCase(mainCommand)}.flags.js';`);
  }

  // Import flags from global file
  const globalImportedFlags = importedFlags.filter((flagKey) => categories.global.flags.has(flagKey));

  if (globalImportedFlags.length > 0) {
    const flagImports = globalImportedFlags.map((flagKey) => getArgFlagExportName(flagKey, 'flag'));
    imports.push(`import { ${flagImports.join(', ')} } from '../global.flags.js';`);
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
    ...mainCommandImportedArgs.map((argKey) => getArgFlagExportName(argKey, 'arg')),
    ...globalImportedArgs.map((argKey) => getArgFlagExportName(argKey, 'arg')),
  ];

  // Build flags array
  const flagsArray = [
    ...inlineFlags,
    ...mainCommandImportedFlags.map((flagKey) => getArgFlagExportName(flagKey, 'flag')),
    ...globalImportedFlags.map((flagKey) => getArgFlagExportName(flagKey, 'flag')),
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

  // 4. Command object with new structure (matching define-command.types.d.ts)
  // Note: name is not included here - it comes from the routing in global.commands.js
  content += `export const ${exportName} = defineCommand({\n`;
  content += `  description: '${escapeString(command.description)}',\n`;

  // isExperimental (optional, only include if true)
  if (command.experimental) {
    content += `  isExperimental: true,\n`;
  }

  // featureFlag (optional, only include if set)
  if (command.featureFlag) {
    content += `  featureFlag: '${escapeString(command.featureFlag)}',\n`;
  }

  // Flags
  if (flagsArray.length > 0) {
    content += `  flags: {\n`;
    flagsArray.forEach((flag, index) => {
      let flagName;
      if (typeof flag === 'string') {
        const flagKey = importedFlags.find((key) => getArgFlagExportName(key, 'flag') === flag);
        if (flagKey) {
          const flagData = flagsLookup.get(flagKey);
          flagName = flagData ? flagData.name : 'unknown';
        } else {
          flagName = 'unknown';
        }
        const quotedFlagName = flagName.includes('-') ? `'${flagName}'` : flagName;
        content += `    ${quotedFlagName}: ${flag}`;
      } else {
        flagName = flag.name;
        const quotedFlagName = flagName.includes('-') ? `'${flagName}'` : flagName;
        content += `    ${quotedFlagName}: defineFlag({\n`;
        content += `      name: '${flag.name}',\n`;
        content += `      schema: ${flag.schema},\n`;
        content += `      description: '${flag.description}'`;
        // aliases (optional)
        if (flag.aliases !== null && flag.aliases.length > 0) {
          content += `,\n      aliases: [${flag.aliases.map((a) => `'${a}'`).join(', ')}]`;
        }
        // placeholder (optional, was metavar)
        if (flag.placeholder !== null) {
          content += `,\n      placeholder: '${flag.placeholder}'`;
        }
        // complete (optional)
        if (flag.complete !== null) {
          if (typeof flag.complete === 'string') {
            content += `,\n      complete: '${escapeString(flag.complete)}'`;
          } else if (flag.complete && flag.complete.__functionRef) {
            content += `,\n      complete: ${flag.complete.__functionRef}`;
          }
        }
        content += `,\n    })`;
      }
      content += index < flagsArray.length - 1 ? ',\n' : '\n';
    });
    content += `  },\n`;
  } else {
    content += `  flags: {},\n`;
  }

  // Args
  if (argsArray.length > 0) {
    content += `  args: [\n`;
    argsArray.forEach((arg) => {
      if (typeof arg === 'string') {
        content += `    ${arg},\n`;
      } else {
        content += `    defineArgument({\n`;
        content += `      schema: ${arg.schema},\n`;
        content += `      description: '${arg.description}',\n`;
        content += `      placeholder: '${escapeString(arg.placeholder)}'`;
        // complete (optional)
        if (arg.complete !== null) {
          if (typeof arg.complete === 'string') {
            content += `,\n      complete: '${escapeString(arg.complete)}'`;
          } else if (arg.complete && arg.complete.__functionRef) {
            content += `,\n      complete: ${arg.complete.__functionRef}`;
          }
        }
        content += `,\n    }),\n`;
      }
    });
    content += `  ],\n`;
  } else {
    content += `  args: [],\n`;
  }

  // Handler function (replaces execute)
  // Reuse the signature from the already-transformed source file (from 02 script)
  if (handlerInfo) {
    const asyncKeyword = handlerInfo.isAsync ? 'async ' : '';
    // Use the params directly from the transformed source file
    content += `  ${asyncKeyword}handler${handlerInfo.params} {\n`;
    // Indent the body
    const bodyLines = handlerInfo.body.split('\n');
    for (const line of bodyLines) {
      content += `    ${line}\n`;
    }
    content += `  },\n`;
  } else if (command.isBuiltin) {
    // Built-in commands (like help) - handler is provided by the CLI framework
    content += `  // Built-in command - handler provided by CLI framework\n`;
    content += `  handler: null,\n`;
  } else if (command.isParentCommand) {
    // Parent-only commands - no handler needed, just a container for subcommands
    content += `  // Parent command - no handler, only contains subcommands\n`;
    content += `  handler: null,\n`;
  } else {
    // No handler found in source file - generate a placeholder
    content += `  handler() {\n`;
    content += `    throw new Error('Not implemented');\n`;
    content += `  },\n`;
  }

  content += `});\n`;

  return content;
}

// Generate args file content
function generateArgsFile(mainCommand) {
  const argKeys = categories.mainCommand.args.get(mainCommand);
  if (!argKeys || argKeys.size === 0) return null;

  const completeImports = new Map();
  const parserImports = new Set();
  const argData = [];

  for (const argKey of argKeys) {
    const arg = argsLookup.get(argKey);
    if (arg) {
      const { schema, parserImport } = parserToZodSchemaForArg(arg);
      let completeInfo = null;

      // Collect parser import
      if (parserImport) {
        parserImports.add(parserImport);
      }

      // Handle complete - convert to function reference
      if (arg.complete !== undefined && arg.complete !== null) {
        if (typeof arg.complete === 'string') {
          const parsed = parseStringCompletion(arg.complete);
          if (parsed) {
            completeInfo = { __functionRef: parsed.importName, __importInfo: parsed };
            if (!completeImports.has(parsed.importFile)) {
              completeImports.set(parsed.importFile, new Set());
            }
            completeImports.get(parsed.importFile).add(parsed.importName);
          } else {
            completeInfo = arg.complete; // Keep as string
          }
        } else if (typeof arg.complete === 'object') {
          completeInfo = { __functionRef: arg.complete.importName, __importInfo: arg.complete };
          if (!completeImports.has(arg.complete.importFile)) {
            completeImports.set(arg.complete.importFile, new Set());
          }
          completeImports.get(arg.complete.importFile).add(arg.complete.importName);
        }
      }

      argData.push({ argKey, arg, schema, completeInfo });
    }
  }

  let content = '';

  // Add defineArgument import
  content += `import { defineArgument } from '../../lib/define-argument.js';\n`;

  // Add zod import
  content += `import { z } from 'zod';\n`;

  // Add parser imports if any
  if (parserImports.size > 0) {
    const sortedParserImports = Array.from(parserImports).sort();
    content += `import { ${sortedParserImports.join(', ')} } from '../../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  content += '\n';

  for (const { argKey, arg, schema, completeInfo } of argData) {
    const exportName = getArgFlagExportName(argKey, 'arg');

    content += `export const ${exportName} = defineArgument({\n`;
    content += `  schema: ${schema},\n`;
    content += `  description: '${escapeString(arg.description)}',\n`;
    content += `  placeholder: '${escapeString(arg.name)}'`;

    // complete (optional)
    if (completeInfo !== null) {
      if (typeof completeInfo === 'string') {
        content += `,\n  complete: '${escapeString(completeInfo)}'`;
      } else if (completeInfo.__functionRef) {
        content += `,\n  complete: ${completeInfo.__functionRef}`;
      }
    }

    content += `,\n});\n\n`;
  }

  return content;
}

// Generate flags file content
function generateFlagsFile(mainCommand) {
  const flagKeys = categories.mainCommand.flags.get(mainCommand);
  if (!flagKeys || flagKeys.size === 0) return null;

  const completeImports = new Map();
  const parserImports = new Set();
  const flagData = [];

  for (const flagKey of flagKeys) {
    const flag = flagsLookup.get(flagKey);
    if (flag) {
      const { schema, parserImport } = parserToZodSchema(flag);
      let completeInfo = null;

      // Collect parser import
      if (parserImport) {
        parserImports.add(parserImport);
      }

      // Handle complete - convert to function reference
      if (flag.complete !== undefined && flag.complete !== null) {
        if (typeof flag.complete === 'string') {
          const parsed = parseStringCompletion(flag.complete);
          if (parsed) {
            completeInfo = { __functionRef: parsed.importName, __importInfo: parsed };
            if (!completeImports.has(parsed.importFile)) {
              completeImports.set(parsed.importFile, new Set());
            }
            completeImports.get(parsed.importFile).add(parsed.importName);
          } else {
            completeInfo = flag.complete; // Keep as string
          }
        } else if (typeof flag.complete === 'object') {
          completeInfo = { __functionRef: flag.complete.importName, __importInfo: flag.complete };
          if (!completeImports.has(flag.complete.importFile)) {
            completeImports.set(flag.complete.importFile, new Set());
          }
          completeImports.get(flag.complete.importFile).add(flag.complete.importName);
        }
      }

      flagData.push({ flagKey, flag, schema, completeInfo });
    }
  }

  let content = '';

  // Add defineFlag import
  content += `import { defineFlag } from '../../lib/define-flag.js';\n`;

  // Add zod import
  content += `import { z } from 'zod';\n`;

  // Add parser imports if any
  if (parserImports.size > 0) {
    const sortedParserImports = Array.from(parserImports).sort();
    content += `import { ${sortedParserImports.join(', ')} } from '../../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  content += '\n';

  for (const { flagKey, flag, schema, completeInfo } of flagData) {
    const exportName = getArgFlagExportName(flagKey, 'flag');

    content += `export const ${exportName} = defineFlag({\n`;
    content += `  name: '${escapeString(flag.name)}',\n`;
    content += `  schema: ${schema},\n`;
    content += `  description: '${escapeString(flag.description)}'`;

    // aliases (optional)
    if (flag.aliases && flag.aliases.length > 0) {
      content += `,\n  aliases: [${flag.aliases.map((a) => `'${escapeString(a)}'`).join(', ')}]`;
    }

    // placeholder (optional, was metavar)
    if (flag.metavar) {
      content += `,\n  placeholder: '${escapeString(flag.metavar)}'`;
    }

    // complete (optional)
    if (completeInfo !== null) {
      if (typeof completeInfo === 'string') {
        content += `,\n  complete: '${escapeString(completeInfo)}'`;
      } else if (completeInfo.__functionRef) {
        content += `,\n  complete: ${completeInfo.__functionRef}`;
      }
    }

    content += `,\n});\n\n`;
  }

  return content;
}

// Generate global args file content
function generateGlobalArgsFile() {
  if (categories.global.args.size === 0) return null;

  const completeImports = new Map();
  const parserImports = new Set();
  const argData = [];

  for (const argKey of categories.global.args) {
    const arg = argsLookup.get(argKey);
    if (arg) {
      const { schema, parserImport } = parserToZodSchemaForArg(arg);
      let completeInfo = null;

      // Collect parser import
      if (parserImport) {
        parserImports.add(parserImport);
      }

      // Handle complete - convert to function reference
      if (arg.complete !== undefined && arg.complete !== null) {
        if (typeof arg.complete === 'string') {
          const parsed = parseStringCompletion(arg.complete);
          if (parsed) {
            completeInfo = { __functionRef: parsed.importName, __importInfo: parsed };
            if (!completeImports.has(parsed.importFile)) {
              completeImports.set(parsed.importFile, new Set());
            }
            completeImports.get(parsed.importFile).add(parsed.importName);
          } else {
            completeInfo = arg.complete; // Keep as string
          }
        } else if (typeof arg.complete === 'object') {
          completeInfo = { __functionRef: arg.complete.importName, __importInfo: arg.complete };
          if (!completeImports.has(arg.complete.importFile)) {
            completeImports.set(arg.complete.importFile, new Set());
          }
          completeImports.get(arg.complete.importFile).add(arg.complete.importName);
        }
      }

      argData.push({ argKey, arg, schema, completeInfo });
    }
  }

  let content = '';

  // Add defineArgument import
  content += `import { defineArgument } from '../lib/define-argument.js';\n`;

  // Add zod import
  content += `import { z } from 'zod';\n`;

  // Add parser imports if any
  if (parserImports.size > 0) {
    const sortedParserImports = Array.from(parserImports).sort();
    content += `import { ${sortedParserImports.join(', ')} } from '../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  content += '\n';

  for (const { argKey, arg, schema, completeInfo } of argData) {
    const exportName = getArgFlagExportName(argKey, 'arg');

    content += `export const ${exportName} = defineArgument({\n`;
    content += `  schema: ${schema},\n`;
    content += `  description: '${escapeString(arg.description)}',\n`;
    content += `  placeholder: '${escapeString(arg.name)}'`;

    // complete (optional)
    if (completeInfo !== null) {
      if (typeof completeInfo === 'string') {
        content += `,\n  complete: '${escapeString(completeInfo)}'`;
      } else if (completeInfo.__functionRef) {
        content += `,\n  complete: ${completeInfo.__functionRef}`;
      }
    }

    content += `,\n});\n\n`;
  }

  return content;
}

// Generate global flags file content
function generateGlobalFlagsFile() {
  // Include both global flags AND CLI-level flags (color, updateNotifier, verbose)
  // CLI-level flags are needed by clever2.js even though they're not used per-command
  const allGlobalFlagKeys = new Set([...categories.global.flags, ...CLI_LEVEL_FLAGS]);

  if (allGlobalFlagKeys.size === 0) return null;

  const completeImports = new Map();
  const parserImports = new Set();
  const flagData = [];

  for (const flagKey of allGlobalFlagKeys) {
    const flag = flagsLookup.get(flagKey);
    if (flag) {
      const { schema, parserImport } = parserToZodSchema(flag);
      let completeInfo = null;

      // Collect parser import
      if (parserImport) {
        parserImports.add(parserImport);
      }

      // Handle complete - convert to function reference
      if (flag.complete !== undefined && flag.complete !== null) {
        if (typeof flag.complete === 'string') {
          const parsed = parseStringCompletion(flag.complete);
          if (parsed) {
            completeInfo = { __functionRef: parsed.importName, __importInfo: parsed };
            if (!completeImports.has(parsed.importFile)) {
              completeImports.set(parsed.importFile, new Set());
            }
            completeImports.get(parsed.importFile).add(parsed.importName);
          } else {
            completeInfo = flag.complete; // Keep as string
          }
        } else if (typeof flag.complete === 'object') {
          completeInfo = { __functionRef: flag.complete.importName, __importInfo: flag.complete };
          if (!completeImports.has(flag.complete.importFile)) {
            completeImports.set(flag.complete.importFile, new Set());
          }
          completeImports.get(flag.complete.importFile).add(flag.complete.importName);
        }
      }

      flagData.push({ flagKey, flag, schema, completeInfo });
    }
  }

  let content = '';

  // Add defineFlag import
  content += `import { defineFlag } from '../lib/define-flag.js';\n`;

  // Add zod import
  content += `import { z } from 'zod';\n`;

  // Add parser imports if any
  if (parserImports.size > 0) {
    const sortedParserImports = Array.from(parserImports).sort();
    content += `import { ${sortedParserImports.join(', ')} } from '../parsers.js';\n`;
  }

  if (completeImports.size > 0) {
    for (const [importFile, importNames] of completeImports) {
      const sortedNames = Array.from(importNames).sort();
      const cleanImportFile = importFile.startsWith('src/') ? importFile.slice(4) : importFile;
      const relativePath = `../${cleanImportFile}`;
      content += `import { ${sortedNames.join(', ')} } from '${relativePath}';\n`;
    }
  }

  content += '\n';

  for (const { flagKey, flag, schema, completeInfo } of flagData) {
    const exportName = getArgFlagExportName(flagKey, 'flag');

    content += `export const ${exportName} = defineFlag({\n`;
    content += `  name: '${escapeString(flag.name)}',\n`;
    content += `  schema: ${schema},\n`;
    content += `  description: '${escapeString(flag.description)}'`;

    // aliases (optional)
    if (flag.aliases && flag.aliases.length > 0) {
      content += `,\n  aliases: [${flag.aliases.map((a) => `'${escapeString(a)}'`).join(', ')}]`;
    }

    // placeholder (optional, was metavar)
    if (flag.metavar) {
      content += `,\n  placeholder: '${escapeString(flag.metavar)}'`;
    }

    // complete (optional)
    if (completeInfo !== null) {
      if (typeof completeInfo === 'string') {
        content += `,\n  complete: '${escapeString(completeInfo)}'`;
      } else if (completeInfo.__functionRef) {
        content += `,\n  complete: ${completeInfo.__functionRef}`;
      }
    }

    content += `,\n});\n\n`;
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
  const baseDir = path.join(process.cwd(), 'src', 'commands2');
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

  // Generate main command flags files
  for (const [mainCommand, flagKeys] of categories.mainCommand.flags) {
    const commandDir = path.join(baseDir, toKebabCase(mainCommand));
    ensureDir(commandDir);

    const fileName = `${toKebabCase(mainCommand)}.flags.js`;
    const filePath = path.join(commandDir, fileName);
    const content = generateFlagsFile(mainCommand);

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

  // Generate global flags file
  const globalFlagsContent = generateGlobalFlagsFile();
  if (globalFlagsContent) {
    const filePath = path.join(baseDir, 'global.flags.js');
    fs.writeFileSync(filePath, globalFlagsContent);
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
  console.log(`Generated ${categories.mainCommand.flags.size} main command flags files`);
  console.log(`Generated ${categories.global.args.size > 0 ? 1 : 0} global args file`);
  console.log(`Generated ${categories.global.flags.size > 0 ? 1 : 0} global flags file`);
  console.log(`Generated 1 global commands file`);
}

try {
  main();

  // Run prettier on generated files
  console.log('\nFormatting generated files with Prettier...');
  execSync('npx prettier --write src/commands2', { stdio: 'inherit' });
  console.log('Formatting complete!');
} catch (error) {
  console.error('Error generating CLI structure:', error.message);
  console.error(error.stack);
  process.exit(1);
}
