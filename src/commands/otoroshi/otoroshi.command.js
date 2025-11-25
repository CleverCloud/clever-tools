import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { colorOpt, humanJsonOutputFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const otoroshiCommand = defineCommand({
  name: 'otoroshi',
  description: 'Manage Clever Cloud Otoroshi services',
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
    await operatorList('otoroshi', params.options.format);
  },
});
