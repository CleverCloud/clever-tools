import { Logger } from '../logger.js';
import { styleText } from './style-text.js';

/**
 * Print a list of items grouped by owner with consistent formatting.
 * @param {Array} items - The items to display
 * @param {Object} options
 * @param {string} options.itemName - Singular name for the items (e.g. "configuration provider")
 * @param {string} options.emptyCommand - Command suggestion shown when no items are found
 * @param {Function} options.getOwnerLabel - Function to get the owner group label from an item
 * @param {Function} options.getItemLabel - Function to get the item display line from an item
 * @param {Function} [options.getItemDetails] - Optional function returning extra lines to display below each item
 * @param {Function} options.groupBy - Function to get the grouping key from an item
 */
export function printGroupedList(
  items,
  { itemName, emptyCommand, getOwnerLabel, getItemLabel, getItemDetails, groupBy },
) {
  if (items.length === 0) {
    Logger.println(`🔎 No ${itemName} found, create one with ${styleText('blue', emptyCommand)} command`);
    return;
  }

  const plural = items.length > 1 ? 's' : '';
  Logger.println(`🔎 Found ${items.length} ${itemName}${plural}:`);
  Logger.println();

  const groups = Object.groupBy(items, groupBy);
  Object.values(groups).forEach((group) => {
    Logger.println(`• ${styleText('bold', getOwnerLabel(group[0]))}`);
    group.forEach((item) => {
      Logger.println(`  • ${getItemLabel(item)}`);
      if (getItemDetails != null) {
        const details = getItemDetails(item);
        if (details) {
          Logger.println(`    ${details}`);
        }
      }
    });
    Logger.println();
  });
}
