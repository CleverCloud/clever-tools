import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { conf, writeOAuthConf } from '../../models/configuration.js';

export const logoutCommand = defineCommand({
  description: 'Logout from Clever Cloud',
  flags: {},
  args: [],
  async handler() {
    // write empty object
    await writeOAuthConf({});
    Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
  },
});
