import { defineCommand } from '../../lib/define-command.js';
import { operatorRebuild } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const metabaseRebuildCommand = defineCommand({
  name: 'rebuild',
  description: 'Rebuild Metabase',
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
    await operatorRebuild('metabase', addonIdOrName);
  },
});
