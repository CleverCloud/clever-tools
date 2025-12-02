import { defineCommand } from '../../lib/define-command.js';
import { operatorRebuild } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const metabaseRebuildCommand = defineCommand({
  description: 'Rebuild Metabase',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorRebuild('metabase', addonIdOrName);
  },
});
