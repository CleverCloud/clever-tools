import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoOpenWebuiCommand = defineCommand({
  description: 'Open the Matomo admin console in your browser',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenWebUi('matomo', addonIdOrName);
  },
});
