import { defineCommand } from '../../lib/define-command.js';
import { operatorRebuild } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakRebuildCommand = defineCommand({
  description: 'Rebuild Keycloak',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorRebuild('keycloak', addonIdOrName);
  },
});
