import * as Application from './application.js';
import { findAddonsByNameOrId, resolveOwnerId, resolveRealId } from './ids-resolver.js';

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolve a drain resource to { ownerId, resourceId }.
 *
 * Accepts app IDs (app_xxx), addon IDs (addon_xxx), typed addon real IDs
 * (postgresql_xxx, cellar_xxx, ...), app names, and addon names.
 *
 * For addons, the resourceId is always the typed real ID (never generic addon_xxx).
 *
 * @param {string} resourceIdOrName - The resource identifier (ID or name)
 * @returns {Promise<{ ownerId: string, resourceId: string }>}
 */
export async function resolveDrainResource(resourceIdOrName) {
  // App ID
  if (resourceIdOrName.match(appIdRegex)) {
    const ownerId = await resolveOwnerId(resourceIdOrName);
    if (ownerId != null) {
      return { ownerId, resourceId: resourceIdOrName };
    }
    throw new Error(`Application '${resourceIdOrName}' not found`);
  }

  // Try as a known ID (addon_xxx, typed addon IDs like postgresql_xxx)
  const ownerIdFromId = await resolveOwnerId(resourceIdOrName);
  if (ownerIdFromId != null) {
    const realId = await resolveRealId(resourceIdOrName).catch(() => null);
    if (realId != null) {
      return { ownerId: ownerIdFromId, resourceId: realId };
    }
    return { ownerId: ownerIdFromId, resourceId: resourceIdOrName };
  }

  // Try as app name
  try {
    const { ownerId, appId } = await Application.resolveId({ app_name: resourceIdOrName }, null);
    return { ownerId, resourceId: appId };
  } catch {
    // Not an app name, try addon name
  }

  // Try as addon name
  const addons = await findAddonsByNameOrId(resourceIdOrName);
  if (addons.length === 1) {
    return { ownerId: addons[0].ownerId, resourceId: addons[0].realId };
  }
  if (addons.length > 1) {
    throw new Error(`Ambiguous name '${resourceIdOrName}', use the resource ID directly`);
  }

  throw new Error(`Resource '${resourceIdOrName}' not found`);
}

/**
 * Handle --resource / --alias / deprecated --app options.
 * Falls back to linked app when nothing is provided.
 *
 * @param {string} resourceIdOrName - from --resource
 * @param {{ app_id?: string, app_name?: string }} appIdOrName - from deprecated --app
 * @param {string} alias - from --alias
 * @returns {Promise<{ ownerId: string, resourceId: string }>}
 */
export async function resolveDrainResourceFromOptions(resourceIdOrName, appIdOrName, alias) {
  if (resourceIdOrName != null) {
    if (appIdOrName != null || alias != null) {
      throw new Error('`--resource` cannot be combined with `--app` or `--alias`');
    }
    return resolveDrainResource(resourceIdOrName);
  }

  // --alias / deprecated --app fallback, also handles linked app (all null)
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  return { ownerId, resourceId: appId };
}
