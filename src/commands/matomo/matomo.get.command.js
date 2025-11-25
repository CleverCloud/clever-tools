import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import {
  operatorList,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
} from '../../lib/operator-commands.js';

export const matomoGetCommand = {
  name: 'get',
  description: 'Get information about a deployed Matomo',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [
    addonIdOrNameArg,
  ],
  async execute(params) {
    const [addonIdOrName] = params.args;
      const { format } = params.options;
      await operatorPrint('matomo', addonIdOrName, format);
  }
};
