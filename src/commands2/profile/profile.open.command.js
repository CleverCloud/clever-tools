import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const profileOpenCommand = defineCommand({
  description: 'Open your profile in the Console',
  since: '3.11.0',
  sinceDate: '2024-12-18',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler() {
    await openBrowser('/users/me/information', 'Opening the profile page in your browser');
  },
});
