import { get as getAddon } from '@clevercloud/client/esm/api/v2/addon.js';
import { findAddonsByNameOrId } from './ids-resolver.js';
import { sendToApi } from './send-to-api.js';

/**
 * Resolve a config provider ID from a name, ID or real ID
 * @param {string} addonIdOrRealIdOrName The add-on ID (addon_xxx), real ID (config_xxx) or name
 * @returns {Promise<{ ownerId: string, realId: string, addonId: string }>} The owner ID, real ID and addon ID
 * @throws {Error} If the add-on is not found
 * @throws {Error} If multiple add-ons are found with the same name
 * @throws {Error} If the add-on is not a configuration provider
 */
export async function resolveConfigProviderId(addonIdOrRealIdOrName) {
  const candidates = await findAddonsByNameOrId(addonIdOrRealIdOrName);

  if (candidates.length === 0) {
    throw new Error(`Config provider not found: ${addonIdOrRealIdOrName}`);
  }

  if (candidates.length > 1) {
    throw new Error(`Ambiguous config provider name '${addonIdOrRealIdOrName}', please use the ID`);
  }

  const { ownerId, addonId, realId } = candidates[0];

  // Verify that the addon is a config provider
  const addon = await getAddon({ id: ownerId, addonId }).then(sendToApi);

  if (addon.provider.id !== 'config-provider') {
    throw new Error(`The add-on '${addonIdOrRealIdOrName}' is not a configuration provider`);
  }

  return { ownerId, realId, addonId };
}
