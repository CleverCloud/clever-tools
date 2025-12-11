import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoOpenLogsCommand = defineCommand({
  description: 'Open the Matomo application logs in Clever Cloud Console',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpenLogs('matomo', addonIdOrName);
  },
});
