import { openBrowser } from '../../models/utils.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const sshKeysOpenCommand = {
  name: 'open',
  description: 'Open the SSH keys management page in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [],
  execute() {
    return openBrowser('/users/me/ssh-keys', 'Opening the SSH keys management page of the Console in your browser');
  },
};
