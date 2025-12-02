import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getFeatures } from '../../models/configuration.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const featuresListCommand = defineCommand({
  description: 'List available experimental features',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { format } = flags;

    const featuresConf = await getFeatures();
    // Add status from configuration file and remove instructions
    const features = Object.entries(EXPERIMENTAL_FEATURES).map(([id, feature]) => {
      const enabled = featuresConf[id] === true;
      return {
        id,
        status: feature.status,
        description: feature.description,
        enabled,
      };
    });

    // For each feature, print the object with the id, status, description and enabled
    switch (format) {
      case 'json': {
        Logger.printJson(features);
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
