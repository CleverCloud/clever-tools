import { defineCommand } from '../../lib/define-command.js';
import { operatorNgDisable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiDisableNgCommand = defineCommand({
  description: 'Unlink Otoroshi from its Network Group',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorNgDisable('otoroshi', addonIdOrName);
  },
});
