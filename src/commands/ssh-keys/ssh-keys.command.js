import dedent from 'dedent';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const sshKeysCommand = defineCommand({
  description: 'Manage SSH keys of the current user',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;

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
  },
});
