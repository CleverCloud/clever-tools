import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoOpenLogsCommand = defineCommand({
  description: 'Open the Matomo application logs in Clever Cloud Console',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenLogs('matomo', addonIdOrName);
  },
});
