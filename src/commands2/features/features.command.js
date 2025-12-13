import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getFeatures } from '../../models/configuration.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const featuresCommand = defineCommand({
  description: 'Manage Clever Tools experimental features',
  since: '3.11.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

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
