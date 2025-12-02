import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseOpenLogsCommand = defineCommand({
  description: 'Open the Metabase application logs in Clever Cloud Console',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenLogs('metabase', addonIdOrName);
  },
});
