import { defineCommand } from '../../lib/define-command.js';
import { operatorNgEnable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiEnableNgCommand = defineCommand({
  description: 'Link Otoroshi to a Network Group',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorNgEnable('otoroshi', addonIdOrName);
  },
});
