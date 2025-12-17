import { defineCommand } from '../../lib/define-command.js';
import { operatorReboot } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakRestartCommand = defineCommand({
  description: 'Restart Keycloak',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorReboot('keycloak', addonIdOrName);
  },
});
