import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const curlCommand = {
  name: 'curl',
  description: 'Query Clever Cloud\'s API using Clever Tools credentials',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  execute: null
};
