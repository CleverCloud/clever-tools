import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const keycloakGetCommand = defineCommand({
  description: 'Get information about a deployed Keycloak',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [addonIdOrNameArg],
  async handler(flags, addonIdOrName) {
    const { format } = flags;
    await operatorPrint('keycloak', addonIdOrName, format);
  },
});
