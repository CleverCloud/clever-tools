import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { Logger } from '../../logger.js';
import { setFeature } from '../../models/configuration.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { featuresArg } from './features.args.js';

export const featuresEnableCommand = {
  name: 'enable',
  description: 'Enable experimental features',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [featuresArg],
  async execute(params) {
    const { features } = params.namedArgs;
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
};
