import { defineCommand } from '../../lib/define-command.js';
import { operatorNgEnable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiEnableNgCommand = defineCommand({
  description: 'Link Otoroshi to a Network Group',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorNgEnable('otoroshi', addonIdOrName);
  },
});
