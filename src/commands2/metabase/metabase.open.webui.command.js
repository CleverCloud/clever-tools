import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseOpenWebuiCommand = defineCommand({
  description: 'Open the Metabase admin console in your browser',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenWebUi('metabase', addonIdOrName);
  },
});
