#!/usr/bin/env node
//
// Generate src/commands/global.commands.metadata.js from each *.command.js,
// and (one-time) migrate src/commands/global.commands.js from eager imports
// to lazy `() => import(…)` loaders if it is still in the eager form.
//
// USAGE: generate-commands-manifest.js [--check]
//
// OPTIONS:
//   --check   Exit non-zero if either output would change. No writes.

import { parse } from '@babel/parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const COMMANDS_FILE = path.join(REPO_ROOT, 'src/commands/global.commands.js');
const METADATA_FILE = path.join(REPO_ROOT, 'src/commands/global.commands.metadata.js');

/** @typedef {{ kind: 'leaf', loaderPath: string, exportName: string }} LazyEntry */
/** @typedef {{ kind: 'parent', parent: LazyEntry, sub: TreeNode }} TupleEntry */
/** @typedef {Record<string, LazyEntry | TupleEntry>} TreeNode */

async function main() {
  const checkMode = process.argv.includes('--check');

  const commandsSource = await fs.readFile(COMMANDS_FILE, 'utf-8');
  const commandsAst = parse(commandsSource, { sourceType: 'module', plugins: ['importAttributes'] });

  // Detect eager form (presence of `import { xxxCommand } from './foo/foo.command.js'`).
  const eagerImports = collectEagerImports(commandsAst);

  let tree;
  let needsCommandsRewrite = false;
  if (eagerImports.size > 0) {
    // Eager form → migrate to lazy.
    tree = parseEagerTree(commandsAst, eagerImports);
    needsCommandsRewrite = true;
  } else {
    tree = parseLazyTree(commandsAst);
  }

  // Extract metadata for every leaf in the tree.
  const metadata = await extractMetadata(tree);

  // Render the new files, then run prettier so generator output matches `format:check`.
  const prettierConfig = (await prettier.resolveConfig(COMMANDS_FILE)) ?? {};
  const format = (source) => prettier.format(source, { ...prettierConfig, parser: 'babel' });
  const [newCommandsSource, newMetadataSource] = await Promise.all([
    format(renderLazyCommandsFile(tree)),
    format(renderMetadataFile(metadata)),
  ]);

  const existingMetadata = await fs.readFile(METADATA_FILE, 'utf-8').catch(() => null);

  const commandsChanged = needsCommandsRewrite || newCommandsSource !== commandsSource;
  const metadataChanged = newMetadataSource !== existingMetadata;

  if (checkMode) {
    if (commandsChanged) {
      console.error(`✖ ${path.relative(REPO_ROOT, COMMANDS_FILE)} is out of date — run \`npm run manifest\``);
    }
    if (metadataChanged) {
      console.error(`✖ ${path.relative(REPO_ROOT, METADATA_FILE)} is out of date — run \`npm run manifest\``);
    }
    if (commandsChanged || metadataChanged) {
      process.exit(1);
    }
    console.log('Manifest is up to date.');
    return;
  }

  if (commandsChanged) {
    await fs.writeFile(COMMANDS_FILE, newCommandsSource, 'utf-8');
    console.log(`Wrote ${path.relative(REPO_ROOT, COMMANDS_FILE)}`);
  }
  if (metadataChanged) {
    await fs.writeFile(METADATA_FILE, newMetadataSource, 'utf-8');
    console.log(`Wrote ${path.relative(REPO_ROOT, METADATA_FILE)}`);
  }
  if (!commandsChanged && !metadataChanged) {
    console.log('Manifest is up to date.');
  }
}

function collectEagerImports(ast) {
  const map = new Map();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    if (!node.source.value.endsWith('.command.js')) continue;
    if (!node.source.value.startsWith('./')) continue;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        map.set(spec.local.name, node.source.value);
      }
    }
  }
  return map;
}

function findGlobalCommandsExport(ast) {
  for (const node of ast.program.body) {
    if (node.type !== 'ExportNamedDeclaration') continue;
    if (node.declaration?.type !== 'VariableDeclaration') continue;
    for (const decl of node.declaration.declarations) {
      if (decl.id.type === 'Identifier' && decl.id.name === 'globalCommands') {
        return decl.init;
      }
    }
  }
  throw new Error('Could not find `export const globalCommands = …` in global.commands.js');
}

/** Walk the eager tree literal and resolve identifier references to their import paths. */
function parseEagerTree(ast, eagerImports) {
  const root = findGlobalCommandsExport(ast);
  if (root.type !== 'ObjectExpression') {
    throw new Error('Expected `globalCommands` to be an object literal');
  }
  return parseObjectExpression(root, (ident) => {
    const importPath = eagerImports.get(ident);
    if (!importPath) throw new Error(`Identifier '${ident}' is not imported from a *.command.js`);
    return { kind: 'leaf', loaderPath: importPath, exportName: ident };
  });
}

/** Walk the lazy tree literal — every leaf is a `lazy(() => import('…').then(m => m.X))` call. */
function parseLazyTree(ast) {
  const root = findGlobalCommandsExport(ast);
  if (root.type !== 'ObjectExpression') {
    throw new Error('Expected `globalCommands` to be an object literal');
  }
  return parseObjectExpression(
    root,
    () => {
      throw new Error('Identifier reference in lazy form is unexpected — expected lazy(...) call');
    },
    /* lazyMode */ true,
  );
}

function parseObjectExpression(objExpr, identToLeaf, lazyMode = false) {
  /** @type {TreeNode} */
  const out = {};
  for (const prop of objExpr.properties) {
    if (prop.type !== 'ObjectProperty') {
      throw new Error(`Unsupported property kind: ${prop.type}`);
    }
    const key = staticKey(prop.key);
    out[key] = parseEntry(prop.value, identToLeaf, lazyMode);
  }
  return out;
}

function parseEntry(node, identToLeaf, lazyMode) {
  if (node.type === 'Identifier') {
    return identToLeaf(node.name);
  }
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'lazy') {
    return parseLazyCall(node);
  }
  if (node.type === 'ArrayExpression') {
    if (node.elements.length !== 2) {
      throw new Error(`Expected [parent, subcommandsObject] tuple, got ${node.elements.length} elements`);
    }
    const [parentNode, subNode] = node.elements;
    const parent = parseEntry(parentNode, identToLeaf, lazyMode);
    if (parent.kind !== 'leaf') throw new Error('Parent in tuple must be a single command, not nested');
    if (subNode.type !== 'ObjectExpression') throw new Error('Second tuple element must be an object literal');
    const sub = parseObjectExpression(subNode, identToLeaf, lazyMode);
    return { kind: 'parent', parent, sub };
  }
  throw new Error(`Unsupported entry node type: ${node.type}`);
}

function parseLazyCall(callExpr) {
  // Expected: lazy(() => import('./path.js').then((m) => m.exportName))
  if (callExpr.arguments.length !== 1) throw new Error('lazy(...) takes exactly one argument');
  const arrow = callExpr.arguments[0];
  if (arrow.type !== 'ArrowFunctionExpression') throw new Error('lazy() argument must be an arrow function');
  const body = arrow.body;
  // body should be `import('./...').then((m) => m.X)`
  if (body.type !== 'CallExpression') throw new Error('lazy() body must be import(...).then(...)');
  if (body.callee.type !== 'MemberExpression' || body.callee.property.name !== 'then') {
    throw new Error('lazy() body must call .then(...)');
  }
  const importCall = body.callee.object;
  if (importCall.type !== 'CallExpression' || importCall.callee.type !== 'Import') {
    throw new Error('lazy() body must wrap a dynamic import()');
  }
  const importArg = importCall.arguments[0];
  if (importArg.type !== 'StringLiteral') throw new Error('Dynamic import path must be a string literal');
  const thenArrow = body.arguments[0];
  if (thenArrow.type !== 'ArrowFunctionExpression') throw new Error('.then() argument must be an arrow function');
  const member = thenArrow.body;
  if (member.type !== 'MemberExpression' || member.property.type !== 'Identifier') {
    throw new Error('.then((m) => m.X) — body must be a member expression');
  }
  return { kind: 'leaf', loaderPath: importArg.value, exportName: member.property.name };
}

function staticKey(keyNode) {
  if (keyNode.type === 'Identifier') return keyNode.name;
  if (keyNode.type === 'StringLiteral') return keyNode.value;
  throw new Error(`Unsupported object key kind: ${keyNode.type}`);
}

/** Walk every leaf in the tree and extract metadata from the underlying *.command.js. */
async function extractMetadata(tree) {
  /** @type {Record<string, { description: string, featureFlag?: string, isExperimental?: boolean }>} */
  const out = {};
  await walkLeaves(tree, [], async (dottedPath, leaf) => {
    const filePath = path.resolve(path.dirname(COMMANDS_FILE), leaf.loaderPath);
    const source = await fs.readFile(filePath, 'utf-8');
    const ast = parse(source, { sourceType: 'module', plugins: ['importAttributes'] });
    const meta = extractDefineCommandMetadata(ast, leaf.exportName, filePath);
    out[dottedPath] = meta;
  });
  // Sort keys for deterministic output.
  const sorted = {};
  for (const k of Object.keys(out).sort()) sorted[k] = out[k];
  return sorted;
}

async function walkLeaves(tree, prefix, visit) {
  for (const [key, entry] of Object.entries(tree)) {
    const currentPath = [...prefix, key].join('.');
    if (entry.kind === 'leaf') {
      await visit(currentPath, entry);
    } else {
      await visit(currentPath, entry.parent);
      await walkLeaves(entry.sub, [...prefix, key], visit);
    }
  }
}

function extractDefineCommandMetadata(ast, exportName, filePath) {
  // Find `export const xxxCommand = defineCommand({ ... })` (or assignment then export).
  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      for (const decl of node.declaration.declarations) {
        if (decl.id.type === 'Identifier' && decl.id.name === exportName) {
          return readDefineCommandObject(decl.init, exportName, filePath);
        }
      }
    }
  }
  throw new Error(`Could not find export '${exportName}' in ${filePath}`);
}

function readDefineCommandObject(initNode, exportName, filePath) {
  if (
    initNode.type !== 'CallExpression' ||
    initNode.callee.type !== 'Identifier' ||
    initNode.callee.name !== 'defineCommand'
  ) {
    throw new Error(`Expected '${exportName}' to be defineCommand({ ... }) in ${filePath}`);
  }
  const arg = initNode.arguments[0];
  if (arg.type !== 'ObjectExpression')
    throw new Error(`defineCommand argument must be an object literal in ${filePath}`);

  /** @type {{ description?: string, featureFlag?: string, isExperimental?: boolean }} */
  const meta = {};
  for (const prop of arg.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    const key = staticKey(prop.key);
    if (key === 'description') {
      const v = prop.value;
      if (v.type === 'StringLiteral') {
        meta.description = v.value;
      } else if (v.type === 'TemplateLiteral') {
        // Join static parts; replace each `${expr}` with '…' so root help still gets a usable line.
        // The full dynamic description is rendered when the command itself is lazy-loaded.
        let s = '';
        v.quasis.forEach((q, i) => {
          s += q.value.cooked;
          if (i < v.expressions.length) s += '…';
        });
        meta.description = s;
      } else {
        throw new Error(`Non-literal description in ${filePath} (${exportName})`);
      }
    } else if (key === 'featureFlag') {
      if (prop.value.type !== 'StringLiteral')
        throw new Error(`Non-literal featureFlag in ${filePath} (${exportName})`);
      meta.featureFlag = prop.value.value;
    } else if (key === 'isExperimental') {
      if (prop.value.type !== 'BooleanLiteral') {
        throw new Error(`Non-literal isExperimental in ${filePath} (${exportName})`);
      }
      meta.isExperimental = prop.value.value;
    }
  }
  if (meta.description == null) {
    throw new Error(`Missing description on defineCommand in ${filePath} (${exportName})`);
  }
  return meta;
}

function renderLazyCommandsFile(tree) {
  const lines = [
    '// This file is partially generated by scripts/generate-commands-manifest.js.',
    '// The tree structure is hand-maintained — add new commands by adding lazy() entries.',
    '// Descriptions, featureFlag and isExperimental live in global.commands.metadata.js,',
    '// which is fully generated. Run `npm run manifest` after editing.',
    '',
    '/**',
    ' * @typedef {{ loader: () => Promise<import("../lib/define-command.types.js").CommandDefinition> }} LazyCommandEntry',
    ' * @typedef {LazyCommandEntry | [LazyCommandEntry, Record<string, CommandTreeEntry>]} CommandTreeEntry',
    ' */',
    '',
    '/** @type {<T>(loader: () => Promise<T>) => { loader: () => Promise<T> }} */',
    'const lazy = (loader) => ({ loader });',
    '',
    'export const globalCommands = ' + renderTree(tree, 0) + ';',
    '',
    '/**',
    ' * Resolve every lazy command in the tree (handler/options/args included).',
    ' * Used by docs generation and autocomplete — the runtime CLI loads only the',
    ' * matched command path through bin/clever.js.',
    ' */',
    'export async function loadAllCommands() {',
    '  return resolveTree(globalCommands);',
    '}',
    '',
    '/** @param {Record<string, CommandTreeEntry>} tree */',
    'async function resolveTree(tree) {',
    '  // Resolve in parallel but preserve source insertion order in the output.',
    '  const entries = Object.entries(tree);',
    '  const resolved = await Promise.all(',
    '    entries.map(async ([, entry]) => {',
    '      if (Array.isArray(entry)) {',
    '        const [parent, sub] = entry;',
    '        const [resolvedParent, resolvedSub] = await Promise.all([parent.loader(), resolveTree(sub)]);',
    '        return [resolvedParent, resolvedSub];',
    '      }',
    '      return entry.loader();',
    '    }),',
    '  );',
    '  const out = {};',
    '  entries.forEach(([name], i) => {',
    '    out[name] = resolved[i];',
    '  });',
    '  return out;',
    '}',
    '',
  ];
  return lines.join('\n');
}

function renderTree(tree, depth) {
  const indent = '  '.repeat(depth + 1);
  const closeIndent = '  '.repeat(depth);
  const entries = Object.entries(tree);
  if (entries.length === 0) return '{}';
  const lines = ['{'];
  for (const [key, entry] of entries) {
    lines.push(`${indent}${renderKey(key)}: ${renderEntry(entry, depth + 1)},`);
  }
  lines.push(`${closeIndent}}`);
  return lines.join('\n');
}

function renderEntry(entry, depth) {
  if (entry.kind === 'leaf') {
    return renderLazyCall(entry);
  }
  return `[\n${'  '.repeat(depth + 1)}${renderLazyCall(entry.parent)},\n${'  '.repeat(depth + 1)}${renderTree(entry.sub, depth + 1)},\n${'  '.repeat(depth)}]`;
}

function renderLazyCall(leaf) {
  return `lazy(() => import('${leaf.loaderPath}').then((m) => m.${leaf.exportName}))`;
}

function renderKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function renderMetadataFile(metadata) {
  const lines = [
    '// This file is fully generated by scripts/generate-commands-manifest.js.',
    '// Do not edit by hand — run `npm run manifest` to regenerate.',
    '//',
    '// Provides eager metadata (description, featureFlag, isExperimental) so',
    '// bin/clever.js can build the cliparse tree and run feature-flag filtering',
    '// without importing every *.command.js at startup.',
    '',
    '/**',
    ' * @typedef {{ description: string, featureFlag?: string, isExperimental?: boolean }} CommandMetadata',
    ' */',
    '',
    '/** @type {Record<string, CommandMetadata>} */',
    'export const commandsMetadata = {',
  ];
  for (const [key, meta] of Object.entries(metadata)) {
    lines.push(`  ${JSON.stringify(key)}: ${renderMetaValue(meta)},`);
  }
  lines.push('};', '');
  return lines.join('\n');
}

function renderMetaValue(meta) {
  const parts = [`description: ${JSON.stringify(meta.description)}`];
  if (meta.featureFlag != null) parts.push(`featureFlag: ${JSON.stringify(meta.featureFlag)}`);
  if (meta.isExperimental != null) parts.push(`isExperimental: ${meta.isExperimental}`);
  return `{ ${parts.join(', ')} }`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
