import { operatorUpdateVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, targetVersionOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const metabaseVersionUpdateCommand = {
  name: 'update',
  description: 'Update Metabase deployed version',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    target: targetVersionOpt,
  },
  args: [addonIdOrNameArg],
  async execute(params) {
    const [addonIdOrName] = params.args;
    const { target } = params.options;
    await operatorUpdateVersion('metabase', target, addonIdOrName);
  },
};
