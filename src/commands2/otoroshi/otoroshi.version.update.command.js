import { defineCommand } from '../../lib/define-command.js';
import { operatorUpdateVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { targetVersionOption } from '../global.options.js';

export const otoroshiVersionUpdateCommand = defineCommand({
  description: 'Update Otoroshi deployed version',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {
    target: targetVersionOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addonIdOrName) {
    const { target } = options;
    await operatorUpdateVersion('otoroshi', target, addonIdOrName);
  },
});
