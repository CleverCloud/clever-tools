import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const helpCommand = {
  name: 'help',
  description: 'Display help about the Clever Cloud CLI',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [],
  execute: null,
};
