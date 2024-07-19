import { globby } from 'globby';
import fs from 'fs';
import { parse } from '@babel/core';
import MagicString from 'magic-string';
import { walk } from 'estree-walker';

function isRequire (node) {
  return true
    && node.type === 'VariableDeclaration'
    && node.declarations.length === 1
    && node.declarations[0].init?.type === 'CallExpression'
    && node.declarations[0].init?.callee.type === 'Identifier'
    && node.declarations[0].init?.callee.name === 'require';
}

function isModuleExports (node) {
  return true
    && node.type === 'ExpressionStatement'
    && node.expression.type === 'AssignmentExpression'
    && node.expression.operator === '='
    && node.expression.left.type === 'MemberExpression'
    && node.expression.left.object.name === 'module'
    && node.expression.left.property.name === 'exports'
    && true;
}

function isExportedMember (node, exportParts) {
  if (node.type === 'FunctionDeclaration' && exportParts.has(node.id.name)) {
    return node.id.name;
  }
  if (node.type === 'VariableDeclaration' && exportParts.has(node.declarations[0].id.name)) {
    return node.declarations[0].id.name;
  }
  if (node.type === 'ClassDeclaration' && exportParts.has(node.id.name)) {
    return node.id.name;
  }
}

function isDefaultExportMember (node, defaultExport) {
  if (node.type === 'FunctionDeclaration' && defaultExport === node.id.name) {
    return true;
  }
  if (node.type === 'VariableDeclaration' && defaultExport === node.declarations[0].id.name) {
    return true;
  }
  if (node.type === 'ClassDeclaration' && defaultExport === node.id.name) {
    return true;
  }
}

function removeUseStrict (code) {
  return code.replace(/^'use strict';\s+/, '');
}

function trimEnd (code) {
  return code
    .trimEnd() + '\n';
}

function convertFromCjsToEsm (code, file) {

  const ast = parse(code);
  const ms = new MagicString(code);
  const body = ast.program.body;

  let exportParts = new Set();
  let defaultExport = null;
  walk(ast, {
    enter (node, parent, prop, index) {
      if (body.includes(node) && isModuleExports(node)) {
        if (node.expression.right.type === 'Identifier') {
          defaultExport = node.expression.right.name;
          ms.overwrite(node.start, node.end, '');
        }
        if (node.expression.right.type === 'ObjectExpression') {
          exportParts = new Set(node.expression.right.properties.map((p) => p.value.name));
          ms.overwrite(node.start, node.end, '');
        }
      }
    },
  });

  walk(ast, {
    enter (node, parent, prop, index) {
      if (body.includes(node)) {
        const name = isExportedMember(node, exportParts);
        if (name != null) {
          ms.appendLeft(node.start, 'export ');
          exportParts.delete(name);
        }
        if (isDefaultExportMember(node, defaultExport)) {
          ms.appendLeft(node.start, 'export ');
          defaultExport = null;
        }
      }
    },
  });

  walk(ast, {
    enter (node, parent, prop, index) {
      if (body.includes(node) && isRequire(node)) {
        const importPath = node.declarations[0].init.arguments[0].value;
        if (node.declarations[0].id.type === 'ObjectPattern') {
          const importParts = node.declarations[0].id.properties
            .map((o) => {
              return (o.key.name === o.value.name)
                ? o.key.name
                : `${o.key.name} as ${o.value.name}`;
            })
            .join(', ');
          ms.overwrite(node.start, node.end, `import { ${importParts} } from '${importPath}';`);
        }
        else if (node.declarations[0].id.type === 'Identifier') {
          const defaultImportName = node.declarations[0].id.name;
          if (defaultImportName === 'Logger') {
            ms.overwrite(node.start, node.end, `import { ${defaultImportName} } from '${importPath}';`);
          }
          else {
            if (importPath.startsWith('.')) {
              ms.overwrite(node.start, node.end, `import * as ${defaultImportName} from '${importPath}';`);
            }
            else {
              ms.overwrite(node.start, node.end, `import ${defaultImportName} from '${importPath}';`);
            }
          }
        }
      }
    },
  });

  const newCode = ms.toString();
  return newCode;
}

async function run () {

  const fileList = await globby([
    'bin/*.js',
    'scripts/**/*.js',
    'src/**/*.js',
    // 'src/commands/accessl}ogs.js',
    // 'src/logger.js',
  ]);

  for (const file of fileList) {

    const newFile = file;
    // .replace(/\.js$/, '.mjs');
    console.log(file);

    const code = fs.readFileSync(file, { encoding: 'utf8' });
    const codeWithoutUseStrict = removeUseStrict(code);
    const esmCode = convertFromCjsToEsm(codeWithoutUseStrict, file);
    const codeWithCleanEnd = trimEnd(esmCode);

    fs.writeFileSync(newFile, codeWithCleanEnd);
  }
}

run();
