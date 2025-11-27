import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiOpenWebuiCommand = defineCommand({
  description: 'Open the Otoroshi admin console in your browser',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenWebUi('otoroshi', addonIdOrName);
  },
});
