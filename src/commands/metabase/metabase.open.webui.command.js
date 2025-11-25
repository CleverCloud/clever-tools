import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const metabaseOpenWebuiCommand = defineCommand({
  name: 'webui',
  description: 'Open the Metabase admin console in your browser',
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
    await operatorOpenWebUi('metabase', addonIdOrName);
  },
});
