import { defineCommand } from '../../lib/define-command.js';
import { operatorRebuild } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiRebuildCommand = defineCommand({
  description: 'Rebuild Otoroshi',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorRebuild('otoroshi', addonIdOrName);
  },
});
