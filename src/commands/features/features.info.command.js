import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { EXPERIMENTAL_FEATURES } from '../../experimental-features.js';
import { formatTable } from '../../format-table.js';
import { Logger } from '../../logger.js';
import { getFeatures, setFeature } from '../../models/configuration.js';

export const featuresInfoCommand = {
  name: 'info',
  description: 'Display info about an experimental feature',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    {
      name: 'feature',
      description: 'Experimental feature to manage',
      parser: null,
      complete: null
    },
  ],
  async execute(params) {
    const { feature } = params.namedArgs;
      const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);
    
      if (!availableFeatures.includes(feature)) {
        throw new Error(`Unavailable feature: ${feature}`);
      }
    
      Logger.println(EXPERIMENTAL_FEATURES[feature].instructions);
  }
};
