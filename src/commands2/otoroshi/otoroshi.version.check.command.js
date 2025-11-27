import { defineCommand } from '../../lib/define-command.js';
import { operatorCheckVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const otoroshiVersionCheckCommand = defineCommand({
  description: 'Check Otoroshi deployed version',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addonIdOrName) {
    const { format } = flags;
    await operatorCheckVersion('otoroshi', addonIdOrName, format);
  },
});
