import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenLogs } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakOpenLogsCommand = defineCommand({
  description: 'Open the Keycloak application logs in Clever Cloud Console',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorOpenLogs('keycloak', addonIdOrName);
  },
});
