import { EXPERIMENTAL_FEATURES, setFeature } from '../../config/features.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { featuresArg } from './features.args.js';

export const featuresEnableCommand = defineCommand({
  description: 'Enable experimental features',
  since: '3.11.0',
  options: {},
  args: [featuresArg],
  async handler(_options, features) {
    const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

    const unknownFeatures = features.filter((feature) => !availableFeatures.includes(feature));
    if (unknownFeatures.length > 0) {
      throw new Error(`Unavailable feature(s): ${unknownFeatures.join(', ')}`);
    }

    for (const featureName of features) {
      await setFeature(featureName, true);
      Logger.println(`Experimental feature '${featureName}' enabled`);
    }

    if (features.length === 1) {
      Logger.println(EXPERIMENTAL_FEATURES[features[0]].instructions);
    } else {
      Logger.println();
      Logger.println("To learn more about these experimental features, use 'clever features info FEATURE_NAME'");
    }
  },
});
