import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakOpenWebuiCommand = defineCommand({
  description: 'Open the Keycloak admin console in your browser',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenWebUi('keycloak', addonIdOrName);
  },
});
