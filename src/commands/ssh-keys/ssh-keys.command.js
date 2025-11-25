import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { todo_addSshKey as addSshKey, todo_removeSshKey as removeSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import dedent from 'dedent';
import fs from 'node:fs';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';
import { openBrowser } from '../../models/utils.js';

export const sshKeysCommand = {
  name: 'ssh-keys',
  description: 'Manage SSH keys of the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    const { format } = params.options;
    
      const keys = await getUserSshKeys();
    
      switch (format) {
        case 'json': {
          Logger.printJson(keys);
          break;
        }
        case 'human':
        default: {
          if (keys.length === 0) {
            Logger.println(dedent`
              ${styleText('blue', '🔐 No SSH keys')}
              
              To list the SSH keys on your local system, use the following command:
              ${styleText('grey', 'ssh-add -l -E sha256')}
              
              To create a new key pair, use the following command:
              ${styleText('grey', 'ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_clever -C "An optional comment"')}
              
              Then add the public key to your Clever Cloud account:
              ${styleText('grey', 'clever ssh-keys add myNewKey ~/.ssh/id_ed25519_clever.pub')}
            `);
            return;
          }
    
          Logger.println(`🔐 ${keys.length} SSH key(s):`);
          keys.forEach((key) => {
            Logger.println(` • ${styleText('blue', key.name)}`, styleText('grey', `(${key.fingerprint})`));
          });
        }
      }
  }
};
