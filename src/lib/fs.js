import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Reads and parses a JSON file asynchronously.
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
 * @param {{ mode?: number }} [options] - Options for directory creation
 * @returns {Promise<void>}
 * @throws {Error} If the file cannot be written
 */
export async function writeJson(filePath, data, options = {}) {
  /** @type {{ recursive: true, mode?: number }} */
  const mkdirOptions = { recursive: true };
  if (options.mode != null) {
    mkdirOptions.mode = options.mode;
  }
  await fs.mkdir(path.dirname(filePath), mkdirOptions);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
