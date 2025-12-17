import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const otoroshiCommand = defineCommand({
  description: 'Manage Clever Cloud Otoroshi services',
  since: '3.13.0',
  isExperimental: true,
  featureFlag: 'operators',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    await operatorList('otoroshi', options.format);
  },
});
