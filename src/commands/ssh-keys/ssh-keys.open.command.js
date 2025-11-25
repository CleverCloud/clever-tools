import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { todo_addSshKey as addSshKey, todo_removeSshKey as removeSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import dedent from 'dedent';
import fs from 'node:fs';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';
import { openBrowser } from '../../models/utils.js';

export const sshKeysOpenCommand = {
  name: 'open',
  description: 'Open the SSH keys management page in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  execute() {
    return openBrowser('/users/me/ssh-keys', 'Opening the SSH keys management page of the Console in your browser');
  }
};
