import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenWebUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakOpenWebuiCommand = defineCommand({
  description: 'Open the Keycloak admin console in your browser',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpenWebUi('keycloak', addonIdOrName);
  },
});
