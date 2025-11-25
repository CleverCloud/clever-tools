import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const otoroshiGetConfigCommand = {
  name: 'get-config',
  description: 'Get configuration of a deployed Otoroshi in otoroshictl format',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [addonIdOrNameArg],
  async execute(params) {
    const [addonIdOrName] = params.args;
    const { format } = params.options;
    await operatorPrint('otoroshi', addonIdOrName, 'otoroshictl');
  },
};
