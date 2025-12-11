import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { conf, writeOAuthConf } from '../../models/configuration.js';

export const logoutCommand = defineCommand({
  description: 'Logout from Clever Cloud',
  since: '1.0.0',
  sinceDate: '2018-10-15',
  options: {},
  args: [],
  async handler() {
    // write empty object
    await writeOAuthConf({});
    Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
  },
});
