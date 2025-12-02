import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';
import { humanJsonOutputFormatFlag } from '../global.flags.js';

export const profileOpenCommand = defineCommand({
  description: 'Open your profile in the Console',
  flags: {
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler() {
    await openBrowser('/users/me/information', 'Opening the profile page in your browser');
  },
});
