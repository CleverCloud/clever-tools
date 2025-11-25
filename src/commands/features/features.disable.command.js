import { featuresArg } from './features.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { formatTable } from '../../format-table.js';
import { Logger } from '../../logger.js';
import { getFeatures, setFeature } from '../../models/configuration.js';

export const featuresDisableCommand = {
  name: 'disable',
  description: 'Disable experimental features',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    featuresArg,
  ],
  async execute(params) {
    const { features } = params.namedArgs;
      const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);
    
      const unknownFeatures = features.filter((feature) => !availableFeatures.includes(feature));
      if (unknownFeatures.length > 0) {
        throw new Error(`Unavailable feature(s): ${unknownFeatures.join(', ')}`);
      }
    
      for (const featureName of features) {
        await setFeature(featureName, false);
        Logger.println(`Experimental feature '${featureName}' disabled`);
      }
  }
};
