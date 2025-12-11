import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { setFeature } from '../../models/configuration.js';
import { featuresArg } from './features.args.js';

export const featuresDisableCommand = defineCommand({
  description: 'Disable experimental features',
  since: '3.11.0',
  sinceDate: '2024-12-18',
  options: {},
  args: [featuresArg],
  async handler(_options, features) {
    const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

    const unknownFeatures = features.filter((feature) => !availableFeatures.includes(feature));
    if (unknownFeatures.length > 0) {
      throw new Error(`Unavailable feature(s): ${unknownFeatures.join(', ')}`);
    }

    for (const featureName of features) {
      await setFeature(featureName, false);
      Logger.println(`Experimental feature '${featureName}' disabled`);
    }
  },
});
