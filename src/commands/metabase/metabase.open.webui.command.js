import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import {
  operatorCheckVersion,
  operatorList,
  operatorOpen,
  operatorOpenLogs,
  operatorOpenWebUi,
  operatorPrint,
  operatorReboot,
  operatorRebuild,
  operatorUpdateVersion,
} from '../../lib/operator-commands.js';

export const metabaseOpenWebuiCommand = {
  name: 'webui',
  description: 'Open the Metabase admin console in your browser',
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
      await operatorOpenWebUi('metabase', addonIdOrName);
  }
};
