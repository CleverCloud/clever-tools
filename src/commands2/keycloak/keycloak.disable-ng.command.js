import { defineCommand } from '../../lib/define-command.js';
import { operatorNgDisable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakDisableNgCommand = defineCommand({
  description: 'Unlink Keycloak from its Network Group',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorNgDisable('keycloak', addonIdOrName);
  },
});
