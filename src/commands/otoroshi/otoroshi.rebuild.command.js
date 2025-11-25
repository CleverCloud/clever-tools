import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import {
  operatorCheckVersion,
  operatorList,
  operatorNgDisable,
  operatorNgEnable,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
  operatorUpdateVersion,
} from '../../lib/operator-commands.js';

export const otoroshiRebuildCommand = {
  name: 'rebuild',
  description: 'Rebuild Otoroshi',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    addonIdOrNameArg,
  ],
  async execute(params) {
    const [addonIdOrName] = params.args;
      await operatorRebuild('otoroshi', addonIdOrName);
  }
};
