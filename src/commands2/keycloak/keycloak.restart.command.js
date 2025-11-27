import { defineCommand } from '../../lib/define-command.js';
import { operatorReboot } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakRestartCommand = defineCommand({
  description: 'Restart Keycloak',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorReboot('keycloak', addonIdOrName);
  },
});
