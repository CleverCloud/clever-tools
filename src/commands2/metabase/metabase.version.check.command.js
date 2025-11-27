import { defineCommand } from '../../lib/define-command.js';
import { operatorCheckVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const metabaseVersionCheckCommand = defineCommand({
  description: 'Check Metabase deployed version',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addonIdOrName) {
    const { format } = flags;
    await operatorCheckVersion('metabase', addonIdOrName, format);
  },
});
