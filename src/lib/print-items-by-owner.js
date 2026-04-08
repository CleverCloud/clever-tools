import { Logger } from '../logger.js';
import { styleText } from './style-text.js';

/**
 * Print a list of items grouped by owner with consistent formatting.
 * Items must have ownerId, ownerName and name properties.
 * @param {Array} items - The items to display
 * @param {Object} options
 * @param {string} options.itemName - Singular name for the items (e.g. "configuration provider")
 * @param {string} options.emptyCommand - Command suggestion shown when no items are found
 * @param {Function} options.getItemId - Function to get the item ID from an item
 * @param {Function} [options.getExtraLines] - Function returning extra detail lines to display below the item (nulls filtered)
 */
export function printItemsByOwner(items, { itemName, emptyCommand, getItemId, getExtraLines }) {
  if (items.length === 0) {
    Logger.println(`🔎 No ${itemName} found, create one with ${styleText('blue', emptyCommand)} command`);
    return;
  }

  const plural = items.length > 1 ? 's' : '';
  Logger.println(`🔎 Found ${items.length} ${itemName}${plural}:`);
  Logger.println();

  const groups = Object.groupBy(items, (item) => item.ownerId);
  for (const group of Object.values(groups)) {
    const { ownerId, ownerName } = group[0];
    Logger.println(`• ${styleText('bold', `${ownerId} (${ownerName})`)}`);
    for (const item of group) {
      Logger.println(`  • ${item.name || '(unnamed)'} ${styleText('grey', `(${getItemId(item)})`)}`);
      if (getExtraLines != null) {
        for (const line of [getExtraLines(item)].flat().filter(Boolean)) {
          Logger.println(`    ${line}`);
        }
      }
    }
    Logger.println();
  }
}
