import { defineCommand } from '../../lib/define-command.js';
import { operatorOpen } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiOpenCommand = defineCommand({
  description: 'Open the Otoroshi dashboard in Clever Cloud Console',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpen('otoroshi', addonIdOrName);
  },
});
