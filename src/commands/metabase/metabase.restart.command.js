import { defineCommand } from '../../lib/define-command.js';
import { operatorReboot } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseRestartCommand = defineCommand({
  description: 'Restart Metabase',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorReboot('metabase', addonIdOrName);
  },
});
