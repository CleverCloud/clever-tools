import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const metabaseCommand = defineCommand({
  description: 'Manage Clever Cloud Metabase services',
  since: '3.13.0',
  isExperimental: true,
  featureFlag: 'operators',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    await operatorList('metabase', options.format);
  },
});
