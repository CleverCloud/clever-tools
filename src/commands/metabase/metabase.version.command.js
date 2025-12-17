import { defineCommand } from '../../lib/define-command.js';
import { operatorCheckVersion } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const metabaseVersionCommand = defineCommand({
  description: 'Manage Metabase deployed version',
  since: '3.13.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addonIdOrName) {
    const { format } = options;
    await operatorCheckVersion('metabase', addonIdOrName, format);
  },
});
