import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const databaseCommand = {
  name: 'database',
  description: 'Manage databases and backups',
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
