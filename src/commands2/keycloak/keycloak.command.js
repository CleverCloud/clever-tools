import { defineCommand } from '../../lib/define-command.js';
import { operatorList } from '../../lib/operator-commands.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const keycloakCommand = defineCommand({
  description: 'Manage Clever Cloud Keycloak services',
  isExperimental: true,
  featureFlag: 'operators',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    await operatorList('keycloak', flags.format);
  },
});
