import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
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

export const otoroshiCommand = {
  name: 'otoroshi',
  description: 'Manage Clever Cloud Otoroshi services',
  experimental: true,
  featureFlag: 'operators',
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    await operatorList('otoroshi', params.options.format);
  }
};
