import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const matomoCommand = defineCommand({
  description: 'Manage Clever Cloud Matomo services',
  isExperimental: true,
  featureFlag: 'operators',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    await operatorList('addon-matomo', flags.format);
  },
});
