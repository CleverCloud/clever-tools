#!/usr/bin/env node

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

// Load commands from 01-analyse
const analyse1Path = path.join(process.cwd(), 'analysis', 'data', '01-analyse-commands-arguments-options.json');

if (!fs.existsSync(analyse1Path)) {
  console.error(`File not found: ${analyse1Path}`);
  console.error('Run 01-analyse-commands-arguments-options.js first');
  process.exit(1);
}

const analyse1Data = JSON.parse(fs.readFileSync(analyse1Path, 'utf-8'));

// Helper to extract variable names from patterns (destructuring)
function extractNamesFromPattern(pattern) {
  const names = [];

  if (t.isIdentifier(pattern)) {
    names.push(pattern.name);
  } else if (t.isObjectPattern(pattern)) {
    pattern.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
        names.push(prop.value.name);
      } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
        names.push(prop.argument.name);
      }
    });
  } else if (t.isArrayPattern(pattern)) {
    pattern.elements.forEach((element) => {
      if (element && t.isIdentifier(element)) {
        names.push(element.name);
      } else if (element && t.isRestElement(element) && t.isIdentifier(element.argument)) {
        names.push(element.argument.name);
      }
    });
  }

  return names;
}

// Helper to wrap a node in a valid program structure for traversal
function wrapNodeForTraversal(node) {
  if (t.isFunctionDeclaration(node) || t.isClassDeclaration(node)) {
    return t.file(t.program([node]));
  } else if (t.isExpression(node)) {
    return t.file(t.program([t.expressionStatement(node)]));
  } else if (node) {
    return t.file(t.program([t.variableDeclaration('const', [t.variableDeclarator(t.identifier('_'), node)])]));
  }
  return null;
}

// Analyze a single file and return a map of exportedName -> uses (non-exported deps)
function analyzeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  let ast;
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['dynamicImport', 'importAssertions'],
      attachComments: false,
      ranges: true,
      locations: true,
    });
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }

  const declarations = new Map();
  const exportedNames = new Set();

  // Pass 1: Collect exported names
  traverse.default(ast, {
    ExportNamedDeclaration(path) {
      const { node } = path;

      if (node.declaration) {
        if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach((declarator) => {
            const names = extractNamesFromPattern(declarator.id);
            names.forEach((name) => exportedNames.add(name));
          });
        } else if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
          exportedNames.add(node.declaration.id.name);
        } else if (t.isClassDeclaration(node.declaration) && node.declaration.id) {
          exportedNames.add(node.declaration.id.name);
        }
      } else if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          if (t.isExportSpecifier(spec) && t.isIdentifier(spec.local)) {
            exportedNames.add(spec.local.name);
          }
        });
      }
    },
  });

  // Pass 2: Collect all top-level declarations with their AST nodes
  traverse.default(ast, {
    VariableDeclaration(path) {
      const { node } = path;

      if (t.isExportNamedDeclaration(path.parent)) return;
      if (!t.isProgram(path.parent)) return;

      node.declarations.forEach((declarator) => {
        const names = extractNamesFromPattern(declarator.id);
        names.forEach((name) => {
          declarations.set(name, {
            name,
            type: node.kind,
            exported: exportedNames.has(name),
            line: declarator.loc?.start.line ?? node.loc?.start.line,
            node: declarator.init,
          });
        });
      });
    },

    FunctionDeclaration(path) {
      const { node } = path;

      if (t.isExportNamedDeclaration(path.parent)) return;
      if (!t.isProgram(path.parent)) return;

      if (node.id && t.isIdentifier(node.id)) {
        declarations.set(node.id.name, {
          name: node.id.name,
          type: 'function',
          exported: exportedNames.has(node.id.name),
          line: node.loc?.start.line,
          node: node,
        });
      }
    },

    ClassDeclaration(path) {
      const { node } = path;

      if (t.isExportNamedDeclaration(path.parent)) return;
      if (!t.isProgram(path.parent)) return;

      if (node.id && t.isIdentifier(node.id)) {
        declarations.set(node.id.name, {
          name: node.id.name,
          type: 'class',
          exported: exportedNames.has(node.id.name),
          line: node.loc?.start.line,
          node: node,
        });
      }
    },

    ExportNamedDeclaration(path) {
      const { node } = path;

      if (!t.isProgram(path.parent)) return;

      if (node.declaration) {
        if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach((declarator) => {
            const names = extractNamesFromPattern(declarator.id);
            names.forEach((name) => {
              declarations.set(name, {
                name,
                type: node.declaration.kind,
                exported: true,
                line: declarator.loc?.start.line ?? node.loc?.start.line,
                node: declarator.init,
              });
            });
          });
        } else if (t.isFunctionDeclaration(node.declaration)) {
          if (node.declaration.id && t.isIdentifier(node.declaration.id)) {
            declarations.set(node.declaration.id.name, {
              name: node.declaration.id.name,
              type: 'function',
              exported: true,
              line: node.declaration.loc?.start.line,
              node: node.declaration,
            });
          }
        } else if (t.isClassDeclaration(node.declaration)) {
          if (node.declaration.id && t.isIdentifier(node.declaration.id)) {
            declarations.set(node.declaration.id.name, {
              name: node.declaration.id.name,
              type: 'class',
              exported: true,
              line: node.declaration.loc?.start.line,
              node: node.declaration,
            });
          }
        }
      }
    },
  });

  // Pass 3: Build reference graph
  const referenceGraph = new Map();
  const topLevelNames = new Set(declarations.keys());

  for (const [name, decl] of declarations) {
    const references = new Set();

    if (decl.node) {
      const wrapper = wrapNodeForTraversal(decl.node);

      if (wrapper) {
        traverse.default(wrapper, {
          Identifier(identPath) {
            const identName = identPath.node.name;
            if (identName !== name && topLevelNames.has(identName)) {
              references.add(identName);
            }
          },
        });
      }
    }

    referenceGraph.set(name, references);
  }

  // Find non-exported deps for an exported function
  function findNonExportedDeps(declName) {
    const nonExportedDeps = new Set();
    const visited = new Set();

    function dfs(name) {
      if (visited.has(name)) return;
      visited.add(name);

      for (const ref of referenceGraph.get(name) || []) {
        if (!exportedNames.has(ref)) {
          nonExportedDeps.add(ref);
        }
        dfs(ref);
      }
    }

    dfs(declName);

    // Sort by line number (source order)
    return [...nonExportedDeps].sort((a, b) => {
      const lineA = declarations.get(a)?.line ?? 0;
      const lineB = declarations.get(b)?.line ?? 0;
      return lineA - lineB;
    });
  }

  // Build result: map of exportedName -> uses
  const result = new Map();

  for (const [name, decl] of declarations) {
    if (decl.exported) {
      result.set(name, findNonExportedDeps(name));
    }
  }

  return result;
}

// Recursively collect all commands with their path
function collectCommands(commands, parentPath = '') {
  const result = [];

  for (const cmd of commands) {
    const commandPath = parentPath ? `${parentPath} ${cmd.name}` : cmd.name;

    result.push({
      command: commandPath,
      importFile: cmd.importFile,
      importName: cmd.importName,
    });

    if (cmd.subcommands && cmd.subcommands.length > 0) {
      result.push(...collectCommands(cmd.subcommands, commandPath));
    }
  }

  return result;
}

// Main
const allCommands = collectCommands(analyse1Data.commands);

// Group commands by importFile
const fileGroups = new Map();
for (const cmd of allCommands) {
  if (!cmd.importFile) continue;

  if (!fileGroups.has(cmd.importFile)) {
    fileGroups.set(cmd.importFile, []);
  }
  fileGroups.get(cmd.importFile).push(cmd);
}

// Analyze each file once and cache results
const fileAnalysisCache = new Map();

for (const filePath of fileGroups.keys()) {
  const analysis = analyzeFile(filePath);
  if (analysis) {
    fileAnalysisCache.set(filePath, analysis);
  }
}

// Build final output
const output = [];

for (const cmd of allCommands) {
  if (!cmd.importFile || !cmd.importName) continue;

  const fileAnalysis = fileAnalysisCache.get(cmd.importFile);
  if (!fileAnalysis) continue;

  const uses = fileAnalysis.get(cmd.importName) || [];

  output.push({
    command: cmd.command,
    importFile: cmd.importFile,
    importName: cmd.importName,
    uses,
  });
}

// Write to file
const outputPath = path.join(process.cwd(), 'analysis', 'data', '03-analyse-commands-usage.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Generated ${outputPath} with ${output.length} commands`);
