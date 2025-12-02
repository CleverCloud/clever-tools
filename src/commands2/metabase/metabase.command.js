import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const metabaseCommand = defineCommand({
  description: 'Manage Clever Cloud Metabase services',
  isExperimental: true,
  featureFlag: 'operators',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    await operatorList('metabase', flags.format);
  },
});
