import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const matomoGetCommand = defineCommand({
  description: 'Get information about a deployed Matomo',
  since: '3.13.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addonIdOrName) {
    const { format } = options;
    await operatorPrint('matomo', addonIdOrName, format);
  },
});
