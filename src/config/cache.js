import { z } from 'zod';
import { Logger } from '../logger.js';
import { getConfigPath, readJson, writeJson } from './paths.js';

const CACHE_PATH = getConfigPath('ids-cache.json');

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
 * @typedef {z.infer<typeof IdsCacheSchema>} IdsCache
 */

/** @type {IdsCache} */
const EMPTY_CACHE = { owners: {}, addons: {} };

/**
 * Loads the IDs cache from the cache file.
 * Returns an empty cache structure if the file doesn't exist or is invalid.
 * @returns {Promise<IdsCache>} The cached IDs or empty cache structure
 */
export async function loadIdsCache() {
  try {
    const json = await readJson(CACHE_PATH);
    const parsed = IdsCacheSchema.safeParse(json);
    if (!parsed.success) {
      Logger.info(`Invalid IDs cache format in ${CACHE_PATH}`);
      return EMPTY_CACHE;
    }
    return parsed.data;
  } catch (error) {
    Logger.info(`Cannot load IDs cache from ${CACHE_PATH}\n${error.message}`);
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
    await writeJson(CACHE_PATH, ids);
  } catch (error) {
    throw new Error(`Cannot write IDs cache to ${CACHE_PATH}\n${error.message}`);
  }
}
