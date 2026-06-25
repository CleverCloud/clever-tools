#!/usr/bin/env node
//
// Resolve the `since` marker of every command definition to a concrete version.
//
// New commands are committed with `since: null` because the version they ship in
// is only known at release time (release-please computes it from accumulated
// commits). This script, run from the release workflow against the release PR
// branch, rewrites those markers to the upcoming version.
//
// It parses each `*.command.js` file with the TypeScript compiler API (AST) rather
// than regexes, locates the object literal passed to `defineCommand({ ... })`, and
// resolves its `since` property in two cases:
//   - `since: null`  -> rewrite the value to `since: '<version>'`.
//   - `since` absent from the literal:
//       * if the literal spreads another definition (`...x`), `since` is inherited:
//         leave the file untouched and do not report it.
//       * otherwise the property was simply forgotten on a new command: insert
//         `since: '<version>'` into the literal.
// An already-set `since: '<string>'` is left strictly intact. Any other value
// (neither `null` nor a string literal) is a hard error citing the file.
//
// Rewrites are surgical: only the touched property changes (via AST node offsets),
// the rest of the file is preserved byte for byte (no reformatting).
//
// USAGE: resolve-since.js <version>
//
// ARGUMENTS:
//   version         The upcoming release version (semver, e.g. 3.14.0)
//
// EXAMPLES:
//   resolve-since.js 3.14.0
//
import fs from 'node:fs/promises';
import { globSync } from 'tinyglobby';
import ts from 'typescript';
import { runCommand } from './lib/command.js';

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

/**
 * @typedef {Object} SinceResult
 * @property {'resolved'|'inserted'|'unchanged'|'skip'} action - what was done to the file.
 * @property {string} content - the resulting file content (equal to the input when nothing changed).
 * @property {string} [reason] - why the file was skipped (only set when action is 'skip').
 */

runCommand(async () => {
  const version = process.argv[2];

  if (version == null || version === '') {
    throw new Error('Missing argument: version');
  }
  if (!SEMVER_REGEX.test(version)) {
    throw new Error(`Invalid version "${version}", expected semver (e.g. 3.14.0)`);
  }

  const commandFiles = globSync('src/commands/**/*.command.js');
  /** @type {string[]} */
  const resolvedFiles = [];
  /** @type {string[]} */
  const insertedFiles = [];

  for (const file of commandFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const result = resolveSince(content, version, file);

    switch (result.action) {
      case 'skip':
        console.warn(`Skipped ${file}: ${result.reason}`);
        break;
      case 'resolved':
        await fs.writeFile(file, result.content);
        resolvedFiles.push(file);
        break;
      case 'inserted':
        await fs.writeFile(file, result.content);
        insertedFiles.push(file);
        break;
      case 'unchanged':
      default:
        break;
    }
  }

  if (resolvedFiles.length === 0 && insertedFiles.length === 0) {
    console.log('No `since` to resolve.');
    return;
  }

  if (resolvedFiles.length > 0) {
    console.log(`Resolved ${resolvedFiles.length} \`since: null\` to ${version} in:`);
    for (const file of resolvedFiles) {
      console.log(`- ${file}`);
    }
  }
  if (insertedFiles.length > 0) {
    console.log(`Inserted missing \`since: '${version}'\` in:`);
    for (const file of insertedFiles) {
      console.log(`- ${file}`);
    }
  }
});

/**
 * Resolves the `since` marker of a single command file.
 * @param {string} content - the file source.
 * @param {string} version - the upcoming release version.
 * @param {string} file - the file path (used for error/skip messages).
 * @returns {SinceResult}
 */
function resolveSince(content, version, file) {
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const objectLiteral = findDefineCommandObject(sourceFile);

  if (objectLiteral == null) {
    return { action: 'skip', content, reason: 'no `defineCommand({ ... })` call found' };
  }

  /** @type {ts.PropertyAssignment | null} */
  let sinceProp = null;
  let hasSpread = false;
  for (const prop of objectLiteral.properties) {
    if (ts.isSpreadAssignment(prop)) {
      hasSpread = true;
    } else if (ts.isPropertyAssignment(prop) && getPropertyName(prop.name) === 'since') {
      sinceProp = prop;
    }
  }

  // Case 1: `since` is present in the literal.
  if (sinceProp != null) {
    const init = sinceProp.initializer;

    if (init.kind === ts.SyntaxKind.NullKeyword) {
      // `since: null` -> replace just the `null` value with the version string.
      const start = init.getStart(sourceFile);
      const end = init.getEnd();
      const updated = content.slice(0, start) + `'${version}'` + content.slice(end);
      return { action: 'resolved', content: updated };
    }

    if (ts.isStringLiteral(init)) {
      // Already set to a concrete version: leave strictly intact.
      return { action: 'unchanged', content };
    }

    throw new Error(
      `Unexpected \`since\` value in ${file}: \`${init.getText(sourceFile)}\` (expected a string literal or null)`,
    );
  }

  // Case 2: `since` is absent but inherited through a spread (`...x`): leave untouched.
  if (hasSpread) {
    return { action: 'unchanged', content };
  }

  // Case 3: `since` is absent and nothing is spread: it was forgotten, insert it.
  // This safety net (and `insertSince` below) can be dropped once command files are
  // typechecked, since a missing required `since` would then be caught by `tsc`.
  const updated = insertSince(content, objectLiteral, sourceFile, version);
  return { action: 'inserted', content: updated };
}

/**
 * Finds the object literal passed as the first argument of the `defineCommand(...)` call.
 * @param {ts.SourceFile} sourceFile
 * @returns {ts.ObjectLiteralExpression | null}
 */
function findDefineCommandObject(sourceFile) {
  /**
   * @param {ts.Node} node
   * @returns {ts.ObjectLiteralExpression | null}
   */
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineCommand') {
      const arg = node.arguments[0];
      if (arg != null && ts.isObjectLiteralExpression(arg)) {
        return arg;
      }
    }
    // `ts.forEachChild` stops and bubbles up the first truthy callback result.
    return ts.forEachChild(node, visit) ?? null;
  }

  return visit(sourceFile);
}

/**
 * Inserts a `since: '<version>'` property right after the first property of the literal,
 * matching the indentation of the existing properties.
 * @param {string} content - the file source.
 * @param {ts.ObjectLiteralExpression} objectLiteral
 * @param {ts.SourceFile} sourceFile
 * @param {string} version
 * @returns {string}
 */
function insertSince(content, objectLiteral, sourceFile, version) {
  const property = `since: '${version}'`;

  // Empty literal (`defineCommand({})`): insert right after the opening brace.
  if (objectLiteral.properties.length === 0) {
    const insertPos = objectLiteral.getStart(sourceFile) + 1; // just after `{`
    return content.slice(0, insertPos) + `\n  ${property},\n` + content.slice(insertPos);
  }

  const firstProp = objectLiteral.properties[0];
  const propStart = firstProp.getStart(sourceFile);
  const lineStart = content.lastIndexOf('\n', propStart - 1) + 1;
  const indent = content.slice(lineStart, propStart).match(/^[ \t]*/)?.[0] ?? '';

  // Insert after the first property, skipping its trailing comma if there is one.
  let insertPos = firstProp.getEnd();
  let scan = insertPos;
  while (scan < content.length && /\s/.test(content[scan])) {
    scan += 1;
  }
  let prefix = '';
  if (content[scan] === ',') {
    insertPos = scan + 1;
  } else {
    // No trailing comma on the first property: add one before our insertion.
    prefix = ',';
  }

  return content.slice(0, insertPos) + `${prefix}\n${indent}${property},` + content.slice(insertPos);
}

/**
 * Reads the static name of an object property (identifier or string literal key).
 * @param {ts.PropertyName} name
 * @returns {string}
 */
function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return name.getText();
}
