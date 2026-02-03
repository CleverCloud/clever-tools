import { z } from 'zod';
import { readJson, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';
import { getConfigPath } from './paths.js';

const IDS_CACHE_FILEPATH = getConfigPath('ids-cache.json');

const IdsCacheSchema = z.object({
  owners: z.record(z.string(), z.string()),
  addons: z.record(
    z.string(),
    z.object({
      addonId: z.string(),
      realId: z.string(),
    }),
  ),
});

/**
 * @typedef {z.output<typeof IdsCacheSchema>} IdsCache
 */

/** @type {IdsCache} */
const EMPTY_CACHE = { owners: {}, addons: {} };

/**
 * Loads the IDs cache from the cache file.
 * Returns an empty cache structure if the file doesn't exist or is invalid.
 * @returns {Promise<IdsCache>} The cached IDs or empty cache structure
 */
export async function loadIdsCache() {
  Logger.debug(`Get cache ID from ${IDS_CACHE_FILEPATH}`);
  try {
    const rawIdsCache = await readJson(IDS_CACHE_FILEPATH);
    const parsed = IdsCacheSchema.safeParse(rawIdsCache);
    if (!parsed.success) {
      Logger.info(`Invalid IDs cache format in ${IDS_CACHE_FILEPATH}`);
      return EMPTY_CACHE;
    }
    return parsed.data;
  } catch (error) {
    Logger.info(`Cannot load IDs cache from ${IDS_CACHE_FILEPATH}`);
    return EMPTY_CACHE;
  }
}

/**
 * Writes the IDs cache to the cache file.
 * Creates the configuration directory if it doesn't exist.
 * @param {IdsCache} ids - The IDs to cache
 * @returns {Promise<void>}
 * @throws {Error} If the cache file cannot be written
 */
export async function writeIdsCache(ids) {
  try {
    await writeJson(IDS_CACHE_FILEPATH, ids, { mode: 0o700 });
  } catch (error) {
    throw new Error(`Cannot write IDs cache to ${IDS_CACHE_FILEPATH}\n${error.message}`);
  }
}
