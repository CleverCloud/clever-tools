import { operatorList } from '../../lib/operator-commands.js';
import { colorOpt, humanJsonOutputFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const matomoCommand = {
  name: 'matomo',
  description: 'Manage Clever Cloud Matomo services',
  experimental: true,
  featureFlag: 'operators',
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [],
  async execute(params) {
    await operatorList('addon-matomo', params.options.format);
  },
};
