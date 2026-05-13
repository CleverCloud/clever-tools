/**
 * Build an IDs cache file (config/ids-cache.json) keyed by app/addon IDs.
 * Pass `owners` and/or `addons` to fill in the cache contents.
 * Both keys are required by IdsCacheSchema (src/config/cache.js); empty defaults are fine.
 * @param {{ owners?: Record<string, string>, addons?: Record<string, { addonId: string, realId: string }> }} [overrides]
 */
export function idsCache({ owners = {}, addons = {} } = {}) {
  return { owners, addons };
}
