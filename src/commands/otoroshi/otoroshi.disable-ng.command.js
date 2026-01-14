import { defineCommand } from '../../lib/define-command.js';
import { operatorNgDisable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiDisableNgCommand = defineCommand({
  description: 'Unlink Otoroshi from its Network Group',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorNgDisable('otoroshi', addonIdOrName);
  },
});
