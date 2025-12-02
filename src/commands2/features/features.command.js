import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getFeatures } from '../../models/configuration.js';

export const featuresCommand = defineCommand({
  description: 'Manage Clever Tools experimental features',
  flags: {},
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
