import { defineCommand } from '../../lib/define-command.js';
import { operatorOpen } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoOpenCommand = defineCommand({
  description: 'Open the Matomo dashboard in Clever Cloud Console',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpen('matomo', addonIdOrName);
  },
});
