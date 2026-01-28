import { promises as fs } from 'node:fs';
import path from 'node:path';
import xdg from 'xdg';

/**
 * Resolves the full path for a configuration file.
 * @param {string} configFile - The name of the configuration file
 * @returns {string} The absolute path to the configuration file
 */
export function getConfigPath(configFile) {
  return path.resolve(getConfigDir(), configFile);
}

/**
 * Gets the configuration directory path based on the operating system.
 * On Windows, uses APPDATA/clever-cloud, on other platforms uses XDG config path.
 * @returns {string} The absolute path to the configuration directory
 */
function getConfigDir() {
  return process.platform === 'win32'
    ? path.resolve(process.env.APPDATA, 'clever-cloud')
    : xdg.basedir.configPath('clever-cloud');
}

/**
 * Reads and parses a JSON file.
 * @param {string} filePath - The absolute path to the JSON file
 * @returns {Promise<unknown>} The parsed JSON content
 * @throws {Error} If the file cannot be read or parsed
 */
export async function readJson(filePath) {
  const rawFile = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(rawFile);
}

/**
 * Writes data as JSON to a file.
 * Creates the parent directory if it doesn't exist.
 * @param {string} filePath - The absolute path to the JSON file
 * @param {unknown} data - The data to serialize and write
 * @returns {Promise<void>}
 * @throws {Error} If the file cannot be written
 */
export async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { mode: 0o700, recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
