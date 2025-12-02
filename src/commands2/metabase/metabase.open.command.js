import { defineCommand } from '../../lib/define-command.js';
import { operatorOpen } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseOpenCommand = defineCommand({
  description: 'Open the Metabase dashboard in Clever Cloud Console',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpen('metabase', addonIdOrName);
  },
});
