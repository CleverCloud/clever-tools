/**
 * Build an IDs cache file (config/ids-cache.json) keyed by app/addon IDs.
 * Pass `owners` and/or `addons` to fill in the cache contents.
 * Both keys are required by IdsCacheSchema (src/config/cache.js); empty defaults are fine.
 */
export function idsCache({
  owners = {},
  addons = {},
}: { owners?: Record<string, string>; addons?: Record<string, { addonId: string; realId: string }> } = {}) {
  return { owners, addons };
}
