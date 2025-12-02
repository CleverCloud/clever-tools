import { defineCommand } from '../../lib/define-command.js';
import { operatorReboot } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseRestartCommand = defineCommand({
  description: 'Restart Metabase',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorReboot('metabase', addonIdOrName);
  },
});
