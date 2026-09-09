import { getAllFeatures } from '../../config/features.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const featuresListCommand = defineCommand({
  description: 'List available experimental features',
  since: '3.11.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

    const features = getAllFeatures();

    // For each feature, print the object with the id, status, description and enabled
    switch (format) {
      case 'json': {
        // Only expose what's relevant to the user, instructions are printed by the enable/disable commands
        Logger.printJson(
          features.map(({ id, status, description, enabled }) => ({ id, status, description, enabled })),
        );
        break;
      }
      case 'human':
      default: {
        const headers = ['ID', 'STATUS', 'DESCRIPTION', 'ENABLED'];

        Logger.println(
          formatTable([
            headers,
            ...features.map((feature) => [feature.id, feature.status, feature.description, feature.enabled]),
          ]),
        );
      }
    }
  },
});
