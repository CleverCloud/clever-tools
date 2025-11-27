#!/usr/bin/env node

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

// Read the clever.js file
const cleverJsPath = path.join(process.cwd(), 'bin', 'clever.js');
const content = fs.readFileSync(cleverJsPath, 'utf-8');

// Read the command-options.js file for helper functions
const commandOptionsPath = path.join(process.cwd(), 'src', 'command-options.js');
const commandOptionsContent = fs.readFileSync(commandOptionsPath, 'utf-8');

// Parse the files into ASTs
const ast = parse(content, {
  sourceType: 'module',
  plugins: ['dynamicImport', 'importAssertions'],
  attachComments: false,
  ranges: true,
  locations: true,
});

const commandOptionsAst = parse(commandOptionsContent, {
  sourceType: 'module',
  plugins: ['dynamicImport', 'importAssertions'],
  attachComments: false,
  ranges: true,
  locations: true,
});

// Storage for commands data
const commandDefinitions = new Map(); // variableName -> { name, description, experimental, importName, importFile, source, subcommands }
const usedCommands = new Set();
const experimentalCommands = new Set();
const moduleImports = new Map(); // module name -> { importFile, importName }
const completeImports = new Map(); // module name -> importFile (for complete functions)
const argumentDefinitions = new Map(); // argsKey -> { name, argsKey, description }
const optionDefinitions = new Map(); // optsKey -> { type, name, optsKey, description, metavar, aliases, default, required }
const helperFunctions = new Map(); // functionName -> { name, aliases, metavar, default, description, required }

// Parse helper functions from command-options.js
function analyzeHelperFunctions() {
  let currentFunctionName = null;

  traverse.default(commandOptionsAst, {
    ExportNamedDeclaration(path) {
      const { node } = path;

      // Look for export function declarations
      if (t.isFunctionDeclaration(node.declaration)) {
        currentFunctionName = node.declaration.id.name;
      }
    },

    CallExpression(path) {
      const { node } = path;

      // Look for cliparse.option calls
      if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'cliparse' }) &&
        t.isIdentifier(node.callee.property, { name: 'option' }) &&
        currentFunctionName
      ) {
        // Extract option name (first argument)
        const nameArg = node.arguments[0];
        const name = t.isStringLiteral(nameArg) ? nameArg.value : null;

        // Extract properties from options object (second argument)
        let description = null;
        let metavar = null;
        let aliases = [];
        let defaultValue = null;
        let required = null;
        let parser = null;
        let complete = null;

        const optionsArg = node.arguments[1];
        if (t.isObjectExpression(optionsArg)) {
          optionsArg.properties.forEach((optProp) => {
            if (t.isObjectProperty(optProp)) {
              const keyName = t.isIdentifier(optProp.key)
                ? optProp.key.name
                : t.isStringLiteral(optProp.key)
                  ? optProp.key.value
                  : null;

              if (keyName === 'description') {
                if (t.isStringLiteral(optProp.value)) {
                  description = optProp.value.value;
                } else if (t.isTemplateLiteral(optProp.value)) {
                  description = optProp.value.quasis.map((q) => q.value.cooked).join('${...}');
                }
              } else if (keyName === 'metavar') {
                if (t.isStringLiteral(optProp.value)) {
                  metavar = optProp.value.value;
                }
              } else if (keyName === 'aliases') {
                if (t.isArrayExpression(optProp.value)) {
                  aliases = optProp.value.elements.filter((elem) => t.isStringLiteral(elem)).map((elem) => elem.value);
                }
              } else if (keyName === 'default') {
                if (t.isStringLiteral(optProp.value)) {
                  defaultValue = optProp.value.value;
                } else if (t.isBooleanLiteral(optProp.value)) {
                  defaultValue = optProp.value.value;
                } else if (t.isNumericLiteral(optProp.value)) {
                  defaultValue = optProp.value.value;
                }
              } else if (keyName === 'required') {
                if (t.isBooleanLiteral(optProp.value)) {
                  required = optProp.value.value;
                }
              } else if (keyName === 'parser') {
                if (
                  t.isMemberExpression(optProp.value) &&
                  t.isIdentifier(optProp.value.object) &&
                  t.isIdentifier(optProp.value.property)
                ) {
                  parser = optProp.value.property.name;
                } else if (t.isIdentifier(optProp.value)) {
                  parser = optProp.value.name;
                }
              } else if (keyName === 'complete') {
                if (
                  t.isMemberExpression(optProp.value) &&
                  t.isIdentifier(optProp.value.object) &&
                  t.isIdentifier(optProp.value.property)
                ) {
                  // Case: Application.listAvailableAliases
                  const moduleName = optProp.value.object.name;
                  const functionName = optProp.value.property.name;
                  if (completeImports.has(moduleName)) {
                    complete = {
                      importFile: completeImports.get(moduleName),
                      importName: functionName,
                    };
                  }
                } else if (t.isFunctionExpression(optProp.value) || t.isArrowFunctionExpression(optProp.value)) {
                  // Inline complete function - extract the body
                  const funcBody = optProp.value.body;
                  if (t.isBlockStatement(funcBody) && funcBody.body.length > 0) {
                    const returnStmt = funcBody.body.find((stmt) => t.isReturnStatement(stmt));
                    if (returnStmt && returnStmt.argument) {
                      // Convert the return statement back to code
                      const start = returnStmt.argument.start;
                      const end = returnStmt.argument.end;
                      complete = commandOptionsContent.slice(start, end);
                    }
                  }
                }
              }
            }
          });
        }

        if (currentFunctionName && name) {
          helperFunctions.set(currentFunctionName, {
            name,
            aliases,
            metavar,
            default: defaultValue,
            description,
            required,
            parser,
            complete,
          });
        }
      }
    },
  });
}

// Parse commands from AST
function analyzeCommands() {
  // First pass: analyze helper functions
  analyzeHelperFunctions();

  // Second pass: collect all import information
  traverse.default(ast, {
    ImportDeclaration(path) {
      const { node } = path;

      if (t.isStringLiteral(node.source)) {
        const sourcePath = node.source.value;

        // Process command imports
        if (sourcePath.includes('/commands/')) {
          node.specifiers.forEach((spec) => {
            if (t.isImportNamespaceSpecifier(spec) && t.isIdentifier(spec.local)) {
              // import * as env from '../src/commands/env.js'
              const importName = spec.local.name;
              moduleImports.set(importName, {
                importFile: sourcePath.replace('../', ''),
                importName: null, // namespace import
              });
            } else if (t.isImportSpecifier(spec) && t.isIdentifier(spec.local)) {
              // import { curl } from '../src/commands/curl.js'
              const importName = spec.local.name;
              const exportedName = t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value;
              moduleImports.set(importName, {
                importFile: sourcePath.replace('../', ''),
                importName: exportedName,
              });
            }
          });
        }

        // Process model imports (for complete functions)
        if (sourcePath.includes('/models/')) {
          node.specifiers.forEach((spec) => {
            if (t.isImportNamespaceSpecifier(spec) && t.isIdentifier(spec.local)) {
              // import * as Application from '../src/models/application.js'
              const importName = spec.local.name;
              completeImports.set(importName, sourcePath.replace('../', ''));
            }
          });
        }
      }
    },
  });

  // Third pass: analyze arguments
  traverse.default(ast, {
    // Look for args object with cliparse.argument calls
    VariableDeclarator(path) {
      const { node } = path;

      if (t.isIdentifier(node.id, { name: 'args' }) && t.isObjectExpression(node.init)) {
        // Extract all arguments from the args object
        node.init.properties.forEach((prop) => {
          if (t.isObjectProperty(prop) && t.isCallExpression(prop.value)) {
            const { value: callExpr } = prop;

            // Check if this is a cliparse.argument call
            if (
              t.isMemberExpression(callExpr.callee) &&
              t.isIdentifier(callExpr.callee.object, { name: 'cliparse' }) &&
              t.isIdentifier(callExpr.callee.property, { name: 'argument' })
            ) {
              // Extract argsKey (property key)
              let argsKey = null;
              if (t.isIdentifier(prop.key)) {
                argsKey = prop.key.name;
              } else if (t.isStringLiteral(prop.key)) {
                argsKey = prop.key.value;
              }

              // Extract name (first argument)
              const nameArg = callExpr.arguments[0];
              const name = t.isStringLiteral(nameArg) ? nameArg.value : null;

              // Extract description, parser, and complete from options object (second argument)
              let description = null;
              let parser = null;
              let complete = null;
              const optionsArg = callExpr.arguments[1];
              if (t.isObjectExpression(optionsArg)) {
                const descProp = optionsArg.properties.find((prop) => {
                  if (t.isObjectProperty(prop)) {
                    return (
                      t.isIdentifier(prop.key, { name: 'description' }) ||
                      (t.isStringLiteral(prop.key) && prop.key.value === 'description')
                    );
                  }
                  return false;
                });

                if (descProp && t.isObjectProperty(descProp)) {
                  if (t.isStringLiteral(descProp.value)) {
                    description = descProp.value.value;
                  } else if (t.isTemplateLiteral(descProp.value)) {
                    // Handle template literals - combine quasis and expressions
                    description = descProp.value.quasis.map((q) => q.value.cooked).join('${...}');
                  }
                }

                // Extract parser property
                const parserProp = optionsArg.properties.find((prop) => {
                  if (t.isObjectProperty(prop)) {
                    return (
                      t.isIdentifier(prop.key, { name: 'parser' }) ||
                      (t.isStringLiteral(prop.key) && prop.key.value === 'parser')
                    );
                  }
                  return false;
                });

                if (parserProp && t.isObjectProperty(parserProp)) {
                  if (
                    t.isMemberExpression(parserProp.value) &&
                    t.isIdentifier(parserProp.value.object) &&
                    t.isIdentifier(parserProp.value.property)
                  ) {
                    parser = parserProp.value.property.name;
                  } else if (t.isIdentifier(parserProp.value)) {
                    parser = parserProp.value.name;
                  }
                }

                // Extract complete property
                const completeProp = optionsArg.properties.find((prop) => {
                  if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
                    return (
                      t.isIdentifier(prop.key, { name: 'complete' }) ||
                      (t.isStringLiteral(prop.key) && prop.key.value === 'complete')
                    );
                  }
                  return false;
                });

                if (completeProp && t.isObjectProperty(completeProp)) {
                  if (
                    t.isMemberExpression(completeProp.value) &&
                    t.isIdentifier(completeProp.value.object) &&
                    t.isIdentifier(completeProp.value.property)
                  ) {
                    // Case: Application.listAvailableAliases
                    const moduleName = completeProp.value.object.name;
                    const functionName = completeProp.value.property.name;
                    if (completeImports.has(moduleName)) {
                      complete = {
                        importFile: completeImports.get(moduleName),
                        importName: functionName,
                      };
                    }
                  } else if (
                    t.isFunctionExpression(completeProp.value) ||
                    t.isArrowFunctionExpression(completeProp.value)
                  ) {
                    // Inline complete function - extract the body
                    const funcBody = completeProp.value.body;
                    if (t.isBlockStatement(funcBody) && funcBody.body.length > 0) {
                      const returnStmt = funcBody.body.find((stmt) => t.isReturnStatement(stmt));
                      if (returnStmt && returnStmt.argument) {
                        // Convert the return statement back to code
                        const start = returnStmt.argument.start;
                        const end = returnStmt.argument.end;
                        complete = content.slice(start, end);
                      }
                    }
                  }
                } else if (completeProp && t.isObjectMethod(completeProp)) {
                  // Case: complete() { ... } method syntax
                  const funcBody = completeProp.body;
                  if (t.isBlockStatement(funcBody) && funcBody.body.length > 0) {
                    const returnStmt = funcBody.body.find((stmt) => t.isReturnStatement(stmt));
                    if (returnStmt && returnStmt.argument) {
                      // Convert the return statement back to code
                      const start = returnStmt.argument.start;
                      const end = returnStmt.argument.end;
                      complete = content.slice(start, end);
                    }
                  }
                }
              }

              if (argsKey && name) {
                // Calculate source position information
                const sourceInfo = {
                  line: callExpr.loc.start.line,
                  start: callExpr.start,
                  end: callExpr.end,
                };

                argumentDefinitions.set(argsKey, {
                  name,
                  argsKey,
                  description: description || 'No description available',
                  parser: parser,
                  complete: complete,
                  source: sourceInfo,
                });
              }
            }
          }
        });
      }
    },
  });

  // Fourth pass: analyze options
  traverse.default(ast, {
    // Look for opts object with cliparse.option or cliparse.flag calls
    VariableDeclarator(path) {
      const { node } = path;

      if (t.isIdentifier(node.id, { name: 'opts' }) && t.isObjectExpression(node.init)) {
        // Extract all options from the opts object
        node.init.properties.forEach((prop) => {
          if (t.isObjectProperty(prop) && t.isCallExpression(prop.value)) {
            const { value: callExpr } = prop;

            // Check if this is a cliparse.option or cliparse.flag call
            let type = null;
            let isHelperFunction = false;

            if (t.isMemberExpression(callExpr.callee) && t.isIdentifier(callExpr.callee.object, { name: 'cliparse' })) {
              if (t.isIdentifier(callExpr.callee.property, { name: 'option' })) {
                type = 'option';
              } else if (t.isIdentifier(callExpr.callee.property, { name: 'flag' })) {
                type = 'flag';
              }
            } else if (t.isIdentifier(callExpr.callee)) {
              // Check for helper functions
              const functionName = callExpr.callee.name;
              if (helperFunctions.has(functionName)) {
                type = 'option';
                isHelperFunction = true;
              }
            }

            if (type) {
              // Extract optsKey (property key)
              let optsKey = null;
              if (t.isIdentifier(prop.key)) {
                optsKey = prop.key.name;
              } else if (t.isStringLiteral(prop.key)) {
                optsKey = prop.key.value;
              }

              // Extract name and properties from helper function or direct call
              let name = null;
              let description = null;
              let metavar = null;
              let aliases = [];
              let defaultValue = null;
              let required = null;
              let parser = null;
              let complete = null;
              let helper = null;
              let sourceFile = 'bin/clever.js';

              if (isHelperFunction) {
                const functionName = callExpr.callee.name;
                const helperData = helperFunctions.get(functionName);
                if (helperData) {
                  name = helperData.name;
                  description = helperData.description;
                  metavar = helperData.metavar;
                  aliases = helperData.aliases || [];
                  defaultValue = helperData.default;
                  required = helperData.required;
                  parser = helperData.parser;
                  complete = helperData.complete;
                  sourceFile = 'src/command-options.js';

                  // Generate helper call representation
                  let args = '';
                  if (callExpr.arguments.length > 0) {
                    args = callExpr.arguments
                      .map((arg) => {
                        if (t.isArrayExpression(arg)) {
                          const elements = arg.elements
                            .map((elem) => (t.isStringLiteral(elem) ? `'${elem.value}'` : 'unknown'))
                            .join(', ');
                          return `[${elements}]`;
                        } else if (t.isStringLiteral(arg)) {
                          return `'${arg.value}'`;
                        }
                        return 'unknown';
                      })
                      .join(', ');
                  }
                  helper = `${functionName}(${args})`;
                }
              } else {
                const nameArg = callExpr.arguments[0];
                name = t.isStringLiteral(nameArg) ? nameArg.value : null;
                helper = null;
              }

              const optionsArg = isHelperFunction ? null : callExpr.arguments[1];
              if (t.isObjectExpression(optionsArg)) {
                optionsArg.properties.forEach((optProp) => {
                  if (t.isObjectProperty(optProp)) {
                    const keyName = t.isIdentifier(optProp.key)
                      ? optProp.key.name
                      : t.isStringLiteral(optProp.key)
                        ? optProp.key.value
                        : null;

                    if (keyName === 'description') {
                      if (t.isStringLiteral(optProp.value)) {
                        description = optProp.value.value;
                      } else if (t.isTemplateLiteral(optProp.value)) {
                        // Handle template literals - combine quasis and expressions
                        description = optProp.value.quasis.map((q) => q.value.cooked).join('${...}');
                      }
                    } else if (keyName === 'metavar') {
                      if (t.isStringLiteral(optProp.value)) {
                        metavar = optProp.value.value;
                      }
                    } else if (keyName === 'aliases') {
                      if (t.isArrayExpression(optProp.value)) {
                        aliases = optProp.value.elements
                          .filter((elem) => t.isStringLiteral(elem))
                          .map((elem) => elem.value);
                      }
                    } else if (keyName === 'default') {
                      if (t.isStringLiteral(optProp.value)) {
                        defaultValue = optProp.value.value;
                      } else if (t.isBooleanLiteral(optProp.value)) {
                        defaultValue = optProp.value.value;
                      } else if (t.isNumericLiteral(optProp.value)) {
                        defaultValue = optProp.value.value;
                      }
                    } else if (keyName === 'required') {
                      if (t.isBooleanLiteral(optProp.value)) {
                        required = optProp.value.value;
                      }
                    } else if (keyName === 'parser') {
                      if (
                        t.isMemberExpression(optProp.value) &&
                        t.isIdentifier(optProp.value.object) &&
                        t.isIdentifier(optProp.value.property)
                      ) {
                        parser = optProp.value.property.name;
                      } else if (t.isIdentifier(optProp.value)) {
                        parser = optProp.value.name;
                      }
                    } else if (keyName === 'complete') {
                      if (
                        t.isMemberExpression(optProp.value) &&
                        t.isIdentifier(optProp.value.object) &&
                        t.isIdentifier(optProp.value.property)
                      ) {
                        // Case: Application.listAvailableAliases
                        const moduleName = optProp.value.object.name;
                        const functionName = optProp.value.property.name;
                        if (completeImports.has(moduleName)) {
                          complete = {
                            importFile: completeImports.get(moduleName),
                            importName: functionName,
                          };
                        }
                      } else if (t.isFunctionExpression(optProp.value) || t.isArrowFunctionExpression(optProp.value)) {
                        // Inline complete function - extract the body
                        const funcBody = optProp.value.body;
                        if (t.isBlockStatement(funcBody) && funcBody.body.length > 0) {
                          const returnStmt = funcBody.body.find((stmt) => t.isReturnStatement(stmt));
                          if (returnStmt && returnStmt.argument) {
                            // Convert the return statement back to code
                            const start = returnStmt.argument.start;
                            const end = returnStmt.argument.end;
                            complete = content.slice(start, end);
                          }
                        }
                      }
                    }
                  } else if (t.isObjectMethod(optProp)) {
                    const keyName = t.isIdentifier(optProp.key)
                      ? optProp.key.name
                      : t.isStringLiteral(optProp.key)
                        ? optProp.key.value
                        : null;

                    if (keyName === 'complete') {
                      // Case: complete() { ... } method syntax
                      const funcBody = optProp.body;
                      if (t.isBlockStatement(funcBody) && funcBody.body.length > 0) {
                        const returnStmt = funcBody.body.find((stmt) => t.isReturnStatement(stmt));
                        if (returnStmt && returnStmt.argument) {
                          // Convert the return statement back to code
                          const start = returnStmt.argument.start;
                          const end = returnStmt.argument.end;
                          complete = content.slice(start, end);
                        }
                      }
                    }
                  }
                });
              }

              if (optsKey && name) {
                // Calculate source position information
                const sourceInfo = {
                  line: callExpr.loc.start.line,
                  start: callExpr.start,
                  end: callExpr.end,
                  file: sourceFile,
                };

                optionDefinitions.set(optsKey, {
                  type,
                  name,
                  optsKey,
                  description: description || 'No description available',
                  metavar: metavar || null,
                  aliases: aliases,
                  default: defaultValue,
                  required: required,
                  parser: parser,
                  complete: complete,
                  source: sourceInfo,
                  helper: helper,
                });
              }
            }
          }
        });
      }
    },
  });

  // Fifth pass: analyze commands
  traverse.default(ast, {
    CallExpression(path) {
      const { node } = path;

      // Check if this is a cliparse.command call
      if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'cliparse' }) &&
        t.isIdentifier(node.callee.property, { name: 'command' })
      ) {
        // Extract command name (first argument)
        const firstArg = node.arguments[0];
        const commandName = t.isStringLiteral(firstArg) ? firstArg.value : null;

        // Extract description, commands, args, and options from options object (second argument)
        let description = null;
        let subcommands = [];
        let commandArgs = [];
        let commandOptions = [];
        let commandPrivateOptions = [];
        const optionsArg = node.arguments[1];
        if (t.isObjectExpression(optionsArg)) {
          const descProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'description' }) ||
                (t.isStringLiteral(prop.key) && prop.key.value === 'description')
              );
            }
            return false;
          });

          if (descProp && t.isObjectProperty(descProp)) {
            if (t.isStringLiteral(descProp.value)) {
              description = descProp.value.value;
            } else if (t.isTemplateLiteral(descProp.value)) {
              // Handle template literals
              description = descProp.value.quasis.map((q) => q.value.cooked).join('${...}');
            }
          }

          // Extract commands array for subcommands
          const commandsProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'commands' }) ||
                (t.isStringLiteral(prop.key) && prop.key.value === 'commands')
              );
            }
            return false;
          });

          if (commandsProp && t.isObjectProperty(commandsProp) && t.isArrayExpression(commandsProp.value)) {
            // Extract subcommand variable names
            subcommands = commandsProp.value.elements
              .filter((element) => t.isIdentifier(element))
              .map((element) => element.name);
          }

          // Extract args array for command arguments
          const argsProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'args' }) || (t.isStringLiteral(prop.key) && prop.key.value === 'args')
              );
            }
            return false;
          });

          if (argsProp && t.isObjectProperty(argsProp) && t.isArrayExpression(argsProp.value)) {
            // Extract argument references (e.g., args.addonProvider -> addonProvider)
            commandArgs = argsProp.value.elements
              .filter(
                (element) =>
                  t.isMemberExpression(element) &&
                  t.isIdentifier(element.object, { name: 'args' }) &&
                  t.isIdentifier(element.property),
              )
              .map((element) => element.property.name);
          }

          // Extract options array for command options (inherited by subcommands)
          const optionsProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'options' }) ||
                (t.isStringLiteral(prop.key) && prop.key.value === 'options')
              );
            }
            return false;
          });

          if (optionsProp && t.isObjectProperty(optionsProp) && t.isArrayExpression(optionsProp.value)) {
            // Extract option references (e.g., opts.alias -> alias)
            commandOptions = optionsProp.value.elements
              .filter(
                (element) =>
                  t.isMemberExpression(element) &&
                  t.isIdentifier(element.object, { name: 'opts' }) &&
                  t.isIdentifier(element.property),
              )
              .map((element) => element.property.name);
          }

          // Extract privateOptions array for command-specific options (not inherited by subcommands)
          const privateOptionsProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'privateOptions' }) ||
                (t.isStringLiteral(prop.key) && prop.key.value === 'privateOptions')
              );
            }
            return false;
          });

          if (
            privateOptionsProp &&
            t.isObjectProperty(privateOptionsProp) &&
            t.isArrayExpression(privateOptionsProp.value)
          ) {
            // Extract private option references (e.g., opts.humanJsonOutputFormat -> humanJsonOutputFormat)
            commandPrivateOptions = privateOptionsProp.value.elements
              .filter(
                (element) =>
                  t.isMemberExpression(element) &&
                  t.isIdentifier(element.object, { name: 'opts' }) &&
                  t.isIdentifier(element.property),
              )
              .map((element) => element.property.name);
          }
        }

        // Find the variable this is assigned to
        let variableName = null;
        // Look for parent assignment
        let parent = path.parent;
        while (parent) {
          if (t.isVariableDeclarator(parent) && parent.init === node && t.isIdentifier(parent.id)) {
            variableName = parent.id.name;
            break;
          }
          parent = parent.parent;
        }

        // Extract the function from third argument (e.g., env.list, addon.create)
        let importName = null;
        let importFile = null;
        const functionArg = node.arguments[2];

        if (t.isMemberExpression(functionArg)) {
          // Case: env.list, addon.create
          const moduleName = t.isIdentifier(functionArg.object) ? functionArg.object.name : null;
          const functionName = t.isIdentifier(functionArg.property) ? functionArg.property.name : null;

          if (moduleName && functionName && moduleImports.has(moduleName)) {
            const moduleInfo = moduleImports.get(moduleName);
            importFile = moduleInfo.importFile;
            importName = functionName;
          }
        } else if (t.isIdentifier(functionArg)) {
          // Case: direct function reference like curl
          const functionName = functionArg.name;
          if (moduleImports.has(functionName)) {
            const moduleInfo = moduleImports.get(functionName);
            importFile = moduleInfo.importFile;
            importName = moduleInfo.importName || functionName;
          }
        }

        if (commandName && description && variableName) {
          // Calculate source position information
          const sourceInfo = {
            line: node.loc.start.line,
            start: node.start,
            end: node.end,
          };

          commandDefinitions.set(variableName, {
            name: commandName,
            description,
            experimental: false,
            importFile,
            importName,
            source: sourceInfo,
            subcommands: subcommands,
            args: commandArgs,
            options: commandOptions,
            privateOptions: commandPrivateOptions,
          });
        }
      }

      // Look for commands.push(colorizeExperimentalCommand(...))
      else if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'commands' }) &&
        t.isIdentifier(node.callee.property, { name: 'push' })
      ) {
        const arg = node.arguments[0];
        if (t.isCallExpression(arg) && t.isIdentifier(arg.callee, { name: 'colorizeExperimentalCommand' })) {
          // First argument to colorizeExperimentalCommand is the command
          const commandArg = arg.arguments[0];
          // Second argument is the feature flag
          const featureFlagArg = arg.arguments[1];

          if (t.isIdentifier(commandArg)) {
            const commandName = commandArg.name;
            usedCommands.add(commandName);
            experimentalCommands.add(commandName);

            // Extract feature flag if present
            let featureFlag = null;
            if (t.isStringLiteral(featureFlagArg)) {
              featureFlag = featureFlagArg.value;
            }

            // Store the feature flag for this experimental command
            if (featureFlag && commandDefinitions.has(commandName)) {
              const commandData = commandDefinitions.get(commandName);
              commandDefinitions.set(commandName, {
                ...commandData,
                featureFlag: featureFlag,
              });
            }
          }
        }
      }
    },

    // Find the main commands array
    VariableDeclarator(path) {
      const { node } = path;

      if (t.isIdentifier(node.id, { name: 'commands' }) && t.isArrayExpression(node.init)) {
        // Extract all identifiers from the commands array
        node.init.elements.forEach((element) => {
          if (t.isIdentifier(element)) {
            usedCommands.add(element.name);
          }
        });
      }
    },
  });

  // Function to resolve subcommands recursively
  function resolveSubcommands(subcommandNames) {
    const resolved = [];
    for (const subcommandName of subcommandNames) {
      if (commandDefinitions.has(subcommandName)) {
        const subcommand = commandDefinitions.get(subcommandName);
        const isExperimental = experimentalCommands.has(subcommandName);
        const resolvedSubs = resolveSubcommands(subcommand.subcommands || []);
        // A command is a parent-only command if it has no handler but has subcommands
        const isParentCommand = subcommand.importFile === null && !subcommand.isBuiltin && resolvedSubs.length > 0;
        resolved.push({
          ...subcommand,
          experimental: isExperimental,
          isParentCommand,
          subcommands: resolvedSubs,
        });
      }
    }
    return resolved;
  }

  // Filter to only include commands actually used in the main array
  const finalCommands = [];

  for (const [variableName, commandData] of commandDefinitions) {
    if (usedCommands.has(variableName)) {
      // Mark as experimental if it's in the experimental commands set
      const isExperimental = experimentalCommands.has(variableName);
      const resolvedSubs = resolveSubcommands(commandData.subcommands || []);
      // A command is a parent-only command if it has no handler but has subcommands
      const isParentCommand = commandData.importFile === null && !commandData.isBuiltin && resolvedSubs.length > 0;
      finalCommands.push({
        ...commandData,
        experimental: isExperimental,
        isParentCommand,
        subcommands: resolvedSubs,
      });
    }
  }

  // Sort by name for consistency
  finalCommands.sort((a, b) => a.name.localeCompare(b.name));

  return finalCommands;
}

try {
  const commands = analyzeCommands();

  // Build reverse mapping from arguments to commands
  function buildArgumentCommandMapping(commands, parentPath = '') {
    const argToCommands = new Map();

    for (const cmd of commands) {
      const currentPath = parentPath ? `${parentPath}/${cmd.name}` : cmd.name;

      // Add this command's arguments to the mapping
      if (cmd.args && cmd.args.length > 0) {
        for (const argKey of cmd.args) {
          if (!argToCommands.has(argKey)) {
            argToCommands.set(argKey, []);
          }
          argToCommands.get(argKey).push(currentPath);
        }
      }

      // Recursively process subcommands
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        const subMapping = buildArgumentCommandMapping(cmd.subcommands, currentPath);
        for (const [argKey, commandPaths] of subMapping) {
          if (!argToCommands.has(argKey)) {
            argToCommands.set(argKey, []);
          }
          argToCommands.get(argKey).push(...commandPaths);
        }
      }
    }

    return argToCommands;
  }

  const argToCommandsMap = buildArgumentCommandMapping(commands);

  // Extract global options from main CLI parser
  const globalOptions = [];
  traverse.default(ast, {
    CallExpression(path) {
      const { node } = path;

      // Look for cliparse.cli call
      if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'cliparse' }) &&
        t.isIdentifier(node.callee.property, { name: 'cli' })
      ) {
        // Extract options from the CLI configuration
        const optionsArg = node.arguments[0];
        if (t.isObjectExpression(optionsArg)) {
          const optionsProp = optionsArg.properties.find((prop) => {
            if (t.isObjectProperty(prop)) {
              return (
                t.isIdentifier(prop.key, { name: 'options' }) ||
                (t.isStringLiteral(prop.key) && prop.key.value === 'options')
              );
            }
            return false;
          });

          if (optionsProp && t.isObjectProperty(optionsProp) && t.isArrayExpression(optionsProp.value)) {
            // Extract global option references (e.g., opts.color -> color)
            globalOptions.push(
              ...optionsProp.value.elements
                .filter(
                  (element) =>
                    t.isMemberExpression(element) &&
                    t.isIdentifier(element.object, { name: 'opts' }) &&
                    t.isIdentifier(element.property),
                )
                .map((element) => element.property.name),
            );
          }
        }
      }
    },
  });

  console.log(`Found ${globalOptions.length} global options: ${globalOptions.join(', ')}`);

  // Build option inheritance and reverse mapping from options to commands
  function buildOptionCommandMapping(commands, parentPath = '', inheritedOptions = []) {
    const optToCommands = new Map();
    const processedCommands = [];

    for (const cmd of commands) {
      const currentPath = parentPath ? `${parentPath}/${cmd.name}` : cmd.name;

      // Combine global options + inherited options + command options + private options for this command
      const allOptions = [
        ...globalOptions, // Global options available to all commands
        ...inheritedOptions, // Inherited from parent
        ...(cmd.options || []), // Command's own options (will be inherited by subcommands)
        ...(cmd.privateOptions || []), // Command's private options (not inherited)
      ];

      // Remove duplicates
      const uniqueOptions = [...new Set(allOptions)];

      // Add this command's options to the reverse mapping
      for (const optKey of uniqueOptions) {
        if (!optToCommands.has(optKey)) {
          optToCommands.set(optKey, []);
        }
        optToCommands.get(optKey).push(currentPath);
      }

      // Process subcommands recursively - they inherit global options + parent options + command options (but not privateOptions)
      let processedSubcommands = [];
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        const newInheritedOptions = [
          ...globalOptions, // Global options are always inherited
          ...inheritedOptions,
          ...(cmd.options || []), // Only inherit options, not privateOptions
        ];

        const subResults = buildOptionCommandMapping(cmd.subcommands, currentPath, newInheritedOptions);

        // Merge sub-results
        for (const [optKey, commandPaths] of subResults.optToCommands) {
          if (!optToCommands.has(optKey)) {
            optToCommands.set(optKey, []);
          }
          optToCommands.get(optKey).push(...commandPaths);
        }

        processedSubcommands = subResults.processedCommands;
      }

      // Create processed command with resolved options
      const processedCmd = {
        ...cmd,
        options: uniqueOptions,
        subcommands: processedSubcommands,
      };
      delete processedCmd.privateOptions; // Remove privateOptions from final output
      processedCommands.push(processedCmd);
    }

    return { optToCommands, processedCommands };
  }
  const optionResults = buildOptionCommandMapping(commands, '', globalOptions);
  const optToCommandsMap = optionResults.optToCommands;
  const processedCommands = optionResults.processedCommands;

  // Convert argumentDefinitions Map to array and add command mappings
  const argumentsList = Array.from(argumentDefinitions.values())
    .map((arg) => ({
      ...arg,
      commands: argToCommandsMap.get(arg.argsKey) || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Convert optionDefinitions Map to array and add command mappings
  const optionsList = Array.from(optionDefinitions.values())
    .map((opt) => ({
      ...opt,
      commands: optToCommandsMap.get(opt.optsKey) || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    commands: processedCommands,
    arguments: argumentsList,
    options: optionsList,
  };

  // Write to JSON file
  fs.mkdirSync(path.join(process.cwd(), 'analysis', 'data'), { recursive: true });
  const outputPath = path.join(process.cwd(), 'analysis', 'data', '01-analyse-commands-arguments-options.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(
    `Analysis complete. Found ${commands.length} commands, ${argumentsList.length} arguments, and ${optionsList.length} options.`,
  );
  console.log(`Results written to: ${outputPath}`);
} catch (error) {
  console.error('Error analyzing CLI structure:', error.message);
  console.error(error.stack);
  process.exit(1);
}
