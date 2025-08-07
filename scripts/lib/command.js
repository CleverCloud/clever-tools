import fs from 'node:fs';
import { styleText } from 'node:util';

/**
 * Runs a function and catches any errors, logging them to the console.
 * Handles help flags (-h, --help) and shows usage for ArgumentError, EnvironmentVariableError, and UnknownCommandError.
 * @param {Function} fn - The async function to run
 * @return {void}
 */
export function runCommand(fn) {
  // Check for help flags
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    const scriptPath = process.argv[1];
    const usage = extractUsage(scriptPath);
    console.log(usage);
    process.exit(0);
  }

  fn().catch((/** @type {Error} */ e) => {
    if (e instanceof SyntaxError || e instanceof TypeError) {
      console.error(e);
    } else {
      console.error(`${styleText(['red', 'bold'], 'ERROR:')} ${e.message}`);

      // Show usage for argument and environment variable errors
      if (e instanceof ArgumentError || e instanceof EnvironmentVariableError || e instanceof UnknownCommandError) {
        const scriptPath = process.argv[1];
        const usage = extractUsage(scriptPath);
        console.log('\n' + usage);
      }
    }
    process.exit(1);
  });
}

/**
 * Reads environment variables and validates they are all present.
 * @param {string[]} variableNames - Array of environment variable names to read
 * @returns {string[]} Array of environment variable values in the same order
 * @throws {EnvironmentVariableError} When any environment variable is null, undefined, or empty string
 */
export function readEnvVars(variableNames) {
  const values = [];
  const missing = [];

  for (const varName of variableNames) {
    const value = process.env[varName];
    if (value == null || value === '') {
      missing.push(varName);
    } else {
      values.push(value);
    }
  }

  if (missing.length > 0) {
    throw new EnvironmentVariableError(...missing);
  }

  return values;
}

/**
 * Extracts usage information from the top of a JavaScript file.
 * Looks for comments containing USAGE, ARGUMENTS, and EXAMPLES sections.
 * @param {string} filePath - Path to the JavaScript file
 * @returns {string} The extracted usage information or null if not found
 */
function extractUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let inUsageBlock = false;
    let usageLines = [];

    for (const line of lines) {
      // Stop at the first import/require or actual code
      if (
        line.trim().startsWith('import ') ||
        line.trim().startsWith('require(') ||
        (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#!/'))
      ) {
        break;
      }

      const trimmedLine = line.trim();

      // Start collecting when we see USAGE
      if (trimmedLine.includes('USAGE:')) {
        inUsageBlock = true;
        usageLines.push(trimmedLine);
        continue;
      }

      // Continue collecting if we're in the usage block and it's a comment
      if (inUsageBlock && (trimmedLine.startsWith('//') || trimmedLine === '')) {
        usageLines.push(trimmedLine);
      }
    }

    if (usageLines.length > 0) {
      return usageLines
        .map((line) => line.replace(/^\/\/\s?/, ''))
        .join('\n')
        .trim();
    }
  } catch {
    /* empty */
  }

  return '(no usage details)';
}

/**
 * Custom error for missing or invalid command-line arguments.
 * @param {string} argumentName - The name of the argument
 * @param {string[]} [allowedValues] - Array of allowed values for the argument
 */
export class ArgumentError extends Error {
  constructor(/** @type {string} */ argumentName, /** @type {string[]} */ allowedValues) {
    let message;
    if (allowedValues && allowedValues.length > 0) {
      message = `${argumentName} (must be one of: ${allowedValues.map((/** @type {string} */ v) => `"${v}"`).join(', ')})`;
    } else {
      message = argumentName ? `Missing argument: ${argumentName}` : 'Missing required arguments';
    }
    super(message);
    this.name = 'ArgumentError';
  }
}

/**
 * Custom error for missing or invalid environment variables.
 * @param {...string} variableNames - The names of the missing environment variables
 */
export class EnvironmentVariableError extends Error {
  /**
   * @param {...string} variableNames
   */
  constructor(...variableNames) {
    let message;
    if (variableNames.length === 1) {
      message = `Missing environment variable: ${variableNames[0]}`;
    } else {
      const list = variableNames.map((/** @type {string} */ name) => `- ${name}`).join('\n');
      message = `Missing environment variables:\n${list}`;
    }
    super(message);
    this.name = 'EnvironmentVariableError';
  }
}

/**
 * Custom error for unknown commands.
 */
export class UnknownCommandError extends Error {
  constructor(/** @type {string} */ commandName) {
    super(`Unknown command: ${commandName}`);
    this.name = 'UnknownCommandError';
  }
}
