import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const metabaseGetCommand = defineCommand({
  description: 'Get information about a deployed Metabase',
  since: '3.13.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addonIdOrName) {
    const { format } = options;
    await operatorPrint('metabase', addonIdOrName, format);
  },
});
