import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const otoroshiCommand = defineCommand({
  description: 'Manage Clever Cloud Otoroshi services',
  isExperimental: true,
  featureFlag: 'operators',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    await operatorList('otoroshi', flags.format);
  },
});
