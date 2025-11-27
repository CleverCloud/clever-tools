import { defineCommand } from '../../lib/define-command.js';
import { operatorReboot } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoRestartCommand = defineCommand({
  description: 'Restart Matomo',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorReboot('matomo', addonIdOrName);
  },
});
