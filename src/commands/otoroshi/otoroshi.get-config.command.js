import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiGetConfigCommand = defineCommand({
  description: 'Get configuration of a deployed Otoroshi in otoroshictl format',
  since: '4.4.0',
  sinceDate: '2025-11-13',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorPrint('otoroshi', addonIdOrName, 'otoroshictl');
  },
});
