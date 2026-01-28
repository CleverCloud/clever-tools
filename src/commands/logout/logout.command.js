import { writeOAuthConf } from '../../config/auth.js';
import { conf } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';

export const logoutCommand = defineCommand({
  description: 'Logout from Clever Cloud',
  since: '1.0.0',
  options: {},
  args: [],
  async handler() {
    // write empty object
    await writeOAuthConf({});
    Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
  },
});
