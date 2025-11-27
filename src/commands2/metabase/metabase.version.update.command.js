import { defineCommand } from '../../lib/define-command.js';
import { operatorUpdateVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { targetVersionFlag } from '../global.flags.js';

export const metabaseVersionUpdateCommand = defineCommand({
  description: 'Update Metabase deployed version',
  flags: {
    target: targetVersionFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addonIdOrName) {
    const { target } = flags;
    await operatorUpdateVersion('metabase', target, addonIdOrName);
  },
});
