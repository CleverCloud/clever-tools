import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Calculates the SHA256 hash of a file.
 * @param {string} inputPath - Path to the file to hash
 * @returns {Promise<string>}
 */
export async function getSha256(inputPath) {
  return getFileHash(inputPath, 'sha256');
}

/**
 * Calculates the SHA512 hash of a file.
 * @param {string} inputPath - Path to the file to hash
 * @returns {Promise<string>}
 */
export async function getSha512(inputPath) {
  return getFileHash(inputPath, 'sha512');
}

/**
 * Calculates the hash of a file with the given algorithm.
 * @param {string} inputPath - Path to the file to hash
 * @param {'sha256'|'sha512'} algorithm - Hash algorithm to use
 * @returns {Promise<string>} The hash, hex encoded
 */
async function getFileHash(inputPath, algorithm) {
  const content = await fs.readFile(inputPath);
  return crypto.createHash(algorithm).update(content).digest('hex');
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
