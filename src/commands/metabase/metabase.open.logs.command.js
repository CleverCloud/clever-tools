import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const metabaseOpenLogsCommand = defineCommand({
  name: 'logs',
  description: 'Open the Metabase application logs in Clever Cloud Console',
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
    await operatorOpenLogs('metabase', addonIdOrName);
  },
});
