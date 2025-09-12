import childProcess from 'node:child_process';
import { styleText } from '../../src/lib/style-text.js';

/**
 * Executes a shell command asynchronously and logs the output.
 * Prints the command being executed and any stdout/stderr output.
 * @param {string} command - The shell command to execute
 * @param {{cwd?: string, env?: object, quiet?: boolean}} [options] - Options object with cwd, env, and quiet properties
 * @returns {Promise<void>}
 * @throws {Error} When the command fails
 */
export function exec(command, options = {}) {
  const { cwd, env, quiet = false } = options;

  if (!quiet) {
    if (cwd != null) {
      console.log(styleText('blue', '=> cd ' + cwd));
    }
    console.log(styleText('blue', '=> ') + styleText('blue', command));
  }
  return new Promise((resolve, reject) => {
    /** @type {{cwd?: string, env?: NodeJS.ProcessEnv}} */
    const execOptions = { cwd };
    if (env) {
      execOptions.env = { ...process.env, ...env };
    }
    const child = childProcess.exec(command, execOptions);

    if (!quiet) {
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
    }

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Command failed with exit code ${code}`));
      }
      return resolve();
    });

    child.on('error', () => {
      reject(new Error(`Command execution failed!`));
    });
  });
}

/**
 * Executes a shell command synchronously and returns the output.
 * @param {string} command - The shell command to execute
 * @param {string} [input] - Optional text to pass to the command via stdin
 * @returns {string}
 * @throws {Error} When the command fails
 */
export function execWithStdin(command, input) {
  console.log(styleText('blue', '=> ') + styleText('blue', command));
  const stdout = childProcess.execSync(command, { input, encoding: 'utf8' });
  console.log(stdout);
  return stdout;
}
