import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiGetConfigCommand = defineCommand({
  description: 'Get configuration of a deployed Otoroshi in otoroshictl format',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorPrint('otoroshi', addonIdOrName, 'otoroshictl');
  },
});
