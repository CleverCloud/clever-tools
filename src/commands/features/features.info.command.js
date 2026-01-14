import { z } from 'zod';
import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';

export const featuresInfoCommand = defineCommand({
  description: 'Display info about an experimental feature',
  since: '3.11.0',
  options: {},
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Experimental feature to manage',
      placeholder: 'feature',
    }),
  ],
  async handler(_options, feature) {
    const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

    if (!availableFeatures.includes(feature)) {
      throw new Error(`Unavailable feature: ${feature}`);
    }

    Logger.println(EXPERIMENTAL_FEATURES[feature].instructions);
  },
});
