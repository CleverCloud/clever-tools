import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiOpenLogsCommand = defineCommand({
  description: 'Open the Otoroshi application logs in Clever Cloud Console',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpenLogs('otoroshi', addonIdOrName);
  },
});
