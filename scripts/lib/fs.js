import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Calculates the SHA256 hash of a file.
 * @param {string} inputPath - Path to the file to hash
 * @returns {Promise<string>}
 */
export async function getSha256(inputPath) {
  const content = await fs.readFile(inputPath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return hash;
}

/**
 * Reads and parses a JSON file, returning the parsed object.
 * @param {string} filePath - Path to the JSON file to read
 * @returns {Promise<object>} The parsed JSON object
 */
export async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Writes an object to a JSON file with pretty formatting.
 * @param {string} filePath - Path to the JSON file to write
 * @param {object} data - The data to write as JSON
 * @returns {Promise<void>}
 */
export async function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
