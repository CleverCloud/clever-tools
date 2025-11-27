#!/usr/bin/env node

/**
 * Transformation script to refactor command function signatures
 * from: function cmd(params) { const { x } = params.options; const [y] = params.args; }
 * to:   function cmd(options, y) { const { x } = options; }
 */

import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// Load analysis data
const analysisPath = path.join(ROOT, 'analysis', 'data', '01-analyse-commands-arguments-options.json');
if (!fs.existsSync(analysisPath)) {
  console.error('Analysis data not found. Run 01-analyse-commands-arguments-options.js first');
  process.exit(1);
}

const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

// Build a map of importFile -> [{ importName, argCount }]
// We need to know which exported functions to transform and how many args they expect
function buildCommandMap(commands, result = new Map()) {
  for (const cmd of commands) {
    if (cmd.importFile && cmd.importName) {
      if (!result.has(cmd.importFile)) {
        result.set(cmd.importFile, []);
      }
      result.get(cmd.importFile).push({
        importName: cmd.importName,
        args: cmd.args || [],
        options: cmd.options || [],
      });
    }
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      buildCommandMap(cmd.subcommands, result);
    }
  }
  return result;
}

const commandMap = buildCommandMap(analysisData.commands);

// Process each command file
for (const [importFile, commands] of commandMap) {
  const filePath = path.join(ROOT, importFile);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  console.log(`Processing ${importFile}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['dynamicImport', 'importAssertions'],
  });

  // Build lookup of function name -> command info
  const commandLookup = new Map();
  for (const cmd of commands) {
    commandLookup.set(cmd.importName, cmd);
  }

  let modified = false;

  traverse.default(ast, {
    // Handle: export async function name(params) { ... }
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (!t.isFunctionDeclaration(decl)) return;

      const funcName = decl.id?.name;
      if (!funcName || !commandLookup.has(funcName)) return;

      const cmdInfo = commandLookup.get(funcName);
      const transformed = transformFunction(decl, cmdInfo, content);
      if (transformed) {
        modified = true;
      }
    },

    // Handle: export const name = async (params) => { ... }
    // or: export const name = async function(params) { ... }
    VariableDeclaration(path) {
      if (!t.isExportNamedDeclaration(path.parent)) return;

      for (const declarator of path.node.declarations) {
        if (!t.isIdentifier(declarator.id)) continue;

        const funcName = declarator.id.name;
        if (!commandLookup.has(funcName)) continue;

        const init = declarator.init;
        if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) continue;

        const cmdInfo = commandLookup.get(funcName);
        const transformed = transformFunction(init, cmdInfo, content);
        if (transformed) {
          modified = true;
        }
      }
    },
  });

  if (modified) {
    const output = generate.default(
      ast,
      {
        retainLines: true,
        retainFunctionParens: true,
      },
      content,
    );

    fs.writeFileSync(filePath, output.code);
    console.log(`  ✓ Modified ${importFile}`);
  } else {
    console.log(`  - No changes needed for ${importFile}`);
  }
}

console.log('\nDone! Now update bin/clever.js wrapper manually.');

// Format the modified files
console.log('\nFormatting src/commands...');
try {
  execSync('npx prettier --write "src/commands/**/*.js"', { cwd: ROOT, stdio: 'inherit' });
  console.log('✓ Formatting complete');
} catch (error) {
  console.error('Formatting failed:', error.message);
}

/**
 * Transform a function's params to the new signature
 */
function transformFunction(funcNode, cmdInfo, sourceCode) {
  const params = funcNode.params;

  // Skip if already transformed (no params or first param is not 'params')
  if (params.length === 0) {
    return false;
  }

  const firstParam = params[0];
  if (!t.isIdentifier(firstParam) || firstParam.name !== 'params') {
    return false;
  }

  // Analyze function body to understand params usage
  const usage = analyzeParamsUsage(funcNode.body);

  // Determine new signature
  const newParams = buildNewParams(usage, cmdInfo);

  // Replace params
  funcNode.params = newParams;

  // Transform function body
  transformFunctionBody(funcNode.body, usage);

  return true;
}

/**
 * Analyze how params is used in the function body
 */
function analyzeParamsUsage(body) {
  const usage = {
    usesOptions: false,
    usesArgs: false,
    usesNamedArgs: false,
    argsVarNames: [], // Variable names from params.args destructuring
    namedArgsVarNames: [], // Variable names from params.namedArgs destructuring
    argsDestructuringPaths: [], // AST paths to remove
    namedArgsDestructuringPaths: [],
    hasArgsSlice: false, // Uses params.args.slice() pattern
    argsSliceN: null, // The number passed to slice (e.g., 1 for .slice(1))
    argsSlicePaths: [], // AST paths to params.args.slice(N) calls
    rawArgsAccess: false, // Accesses params.args directly (not destructured)
  };

  traverse.default(
    t.file(t.program([t.isStatement(body) ? body : t.expressionStatement(body)])),
    {
      CallExpression(path) {
        // Check for params.args.slice(N) pattern
        const callee = path.node.callee;
        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.property, { name: 'slice' }) &&
          t.isMemberExpression(callee.object) &&
          t.isIdentifier(callee.object.object, { name: 'params' }) &&
          t.isIdentifier(callee.object.property, { name: 'args' })
        ) {
          usage.hasArgsSlice = true;
          // Extract the slice argument (e.g., 1 from .slice(1))
          if (path.node.arguments.length > 0 && t.isNumericLiteral(path.node.arguments[0])) {
            usage.argsSliceN = path.node.arguments[0].value;
          }
          usage.argsSlicePaths.push(path);
        }
      },

      MemberExpression(path) {
        // Check for params.options, params.args, params.namedArgs
        if (!t.isIdentifier(path.node.object, { name: 'params' })) return;

        const prop = path.node.property;
        if (t.isIdentifier(prop, { name: 'options' })) {
          usage.usesOptions = true;
        } else if (t.isIdentifier(prop, { name: 'args' })) {
          usage.usesArgs = true;
          // Check if it's accessed directly (not in destructuring context, not slice)
          if (
            !t.isVariableDeclarator(path.parent) &&
            !t.isAssignmentExpression(path.parent) &&
            !(t.isMemberExpression(path.parent) && t.isIdentifier(path.parent.property, { name: 'slice' }))
          ) {
            usage.rawArgsAccess = true;
          }
        } else if (t.isIdentifier(prop, { name: 'namedArgs' })) {
          usage.usesNamedArgs = true;
        }
      },

      VariableDeclarator(path) {
        // Find destructuring patterns like: const [x, y] = params.args
        // or: const { feature } = params.namedArgs
        const init = path.node.init;
        if (!t.isMemberExpression(init)) return;
        if (!t.isIdentifier(init.object, { name: 'params' })) return;

        const prop = init.property;

        if (t.isIdentifier(prop, { name: 'args' }) && t.isArrayPattern(path.node.id)) {
          // const [x, y] = params.args
          for (const elem of path.node.id.elements) {
            if (t.isIdentifier(elem)) {
              usage.argsVarNames.push(elem.name);
            } else if (t.isRestElement(elem) && t.isIdentifier(elem.argument)) {
              usage.argsVarNames.push('...' + elem.argument.name);
            }
          }
          usage.argsDestructuringPaths.push(path);
        } else if (t.isIdentifier(prop, { name: 'namedArgs' }) && t.isObjectPattern(path.node.id)) {
          // const { feature } = params.namedArgs
          for (const propNode of path.node.id.properties) {
            if (t.isObjectProperty(propNode) && t.isIdentifier(propNode.value)) {
              usage.namedArgsVarNames.push(propNode.value.name);
            }
          }
          usage.namedArgsDestructuringPaths.push(path);
        }
      },
    },
    undefined,
    { params: true, body: true },
  );

  return usage;
}

/**
 * Build new function parameters based on usage analysis
 */
function buildNewParams(usage, cmdInfo) {
  const newParams = [];

  // Determine if we need flags parameter
  const needsFlags = usage.usesOptions;
  const hasArgs =
    usage.argsVarNames.length > 0 || usage.namedArgsVarNames.length > 0 || usage.hasArgsSlice || usage.rawArgsAccess;

  // If no params needed at all, return empty
  if (!needsFlags && !hasArgs) {
    return [];
  }

  // Add options parameter (or _options if unused)
  if (hasArgs || needsFlags) {
    const optionsName = needsFlags ? 'options' : '_options';
    newParams.push(t.identifier(optionsName));
  }

  // Add positional args from destructuring
  if (usage.argsVarNames.length > 0) {
    // Check if the last one is already a rest element
    const lastIsRest =
      usage.argsVarNames.length > 0 && usage.argsVarNames[usage.argsVarNames.length - 1].startsWith('...');

    for (const name of usage.argsVarNames) {
      if (name.startsWith('...')) {
        newParams.push(t.restElement(t.identifier(name.slice(3))));
      } else {
        newParams.push(t.identifier(name));
      }
    }

    // If there's params.args.slice(N) and N matches the destructured count,
    // the slice is meant to get "the rest" - add a rest param
    // If there's raw access without slice, also add rest param
    if (!lastIsRest) {
      if (usage.hasArgsSlice && usage.argsSliceN === usage.argsVarNames.length) {
        // slice(N) where N = number of destructured args means "get the rest"
        // Add rest param, and mark that slice calls should be replaced with just the rest var
        newParams.push(t.restElement(t.identifier('restArgs')));
        usage.needsRestArgsRename = true;
        usage.replaceSliceWithRestArgs = true; // Signal to replace slice(N) with restArgs
      } else if (usage.hasArgsSlice || usage.rawArgsAccess) {
        // Other patterns - add rest param but keep slice behavior
        newParams.push(t.restElement(t.identifier('restArgs')));
        usage.needsRestArgsRename = true;
      }
    }
  } else if (usage.namedArgsVarNames.length > 0) {
    // namedArgs case (features.js)
    for (const name of usage.namedArgsVarNames) {
      newParams.push(t.identifier(name));
    }
  } else if (usage.hasArgsSlice || usage.rawArgsAccess) {
    // Uses args.slice() or raw access - need rest parameter
    newParams.push(t.restElement(t.identifier('args')));
  }

  return newParams;
}

/**
 * Transform function body to use new parameter names
 */
function transformFunctionBody(body, usage) {
  // Remove params.args and params.namedArgs destructuring statements
  const pathsToRemove = [...usage.argsDestructuringPaths, ...usage.namedArgsDestructuringPaths];

  for (const path of pathsToRemove) {
    // Check if this is the only declarator in the declaration
    const declaration = path.parent;
    if (t.isVariableDeclaration(declaration) && declaration.declarations.length === 1) {
      // Remove the entire statement
      const statementPath = path.parentPath;
      if (statementPath) {
        statementPath.remove();
      }
    } else {
      // Just remove this declarator
      path.remove();
    }
  }

  // Determine what to rename params.args to
  const argsReplacementName = usage.needsRestArgsRename ? 'restArgs' : 'args';

  // Replace params.options with options, and handle params.args patterns
  traverse.default(
    t.file(t.program([t.isStatement(body) ? body : t.expressionStatement(body)])),
    {
      CallExpression(path) {
        // Replace params.args.slice(N) with restArgs when appropriate
        if (usage.replaceSliceWithRestArgs) {
          const callee = path.node.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: 'slice' }) &&
            t.isMemberExpression(callee.object) &&
            t.isIdentifier(callee.object.object, { name: 'params' }) &&
            t.isIdentifier(callee.object.property, { name: 'args' })
          ) {
            // Replace entire params.args.slice(N) call with just restArgs
            path.replaceWith(t.identifier('restArgs'));
          }
        }
      },

      MemberExpression(path) {
        if (
          t.isIdentifier(path.node.object, { name: 'params' }) &&
          t.isIdentifier(path.node.property, { name: 'options' })
        ) {
          path.replaceWith(t.identifier('options'));
        }
        // Replace params.args with args or restArgs (for raw access patterns)
        // But skip if parent is a slice call that we're handling separately
        if (
          t.isIdentifier(path.node.object, { name: 'params' }) &&
          t.isIdentifier(path.node.property, { name: 'args' })
        ) {
          // Skip if this is part of params.args.slice() that we handle in CallExpression
          if (
            usage.replaceSliceWithRestArgs &&
            t.isMemberExpression(path.parent) &&
            t.isIdentifier(path.parent.property, { name: 'slice' })
          ) {
            return;
          }
          path.replaceWith(t.identifier(argsReplacementName));
        }
      },
    },
    undefined,
    { params: true, body: true },
  );
}
