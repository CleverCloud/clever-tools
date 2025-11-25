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

export const sshKeysRemoveAllCommand = {
  name: 'remove-all',
  description: 'Remove all SSH keys from the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    yes: {
      name: 'yes',
      description: 'Skip confirmation and remove all SSH keys directly',
      type: 'flag',
      metavar: null,
      aliases: ['y'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  async execute(params) {
    if (!params.options.yes) {
        await confirm('Are you sure you want to remove all your SSH keys?', 'No SSH keys removed');
      }
    
      const keys = await getUserSshKeys();
    
      if (keys.length === 0) {
        Logger.println('No SSH keys to remove');
        return;
      }
    
      const results = await Promise.all(
        keys.map((key) => {
          const keyNameEncoded = encodeURIComponent(key.name);
          return removeSshKey({ key: keyNameEncoded })
            .then(sendToApi)
            .then(() => [true, key.name])
            .catch(() => [false, key.name]);
        }),
      );
    
      if (results.every(([isRemoved]) => isRemoved)) {
        Logger.printSuccess('All SSH keys were removed successfully');
      } else {
        const keyNamesWithErrors = results
          .filter(([isRemoved]) => !isRemoved)
          .map(([_, keyName]) => keyName)
          .join(', ');
        throw new Error(`Some errors occured while removing these SSH keys: ${keyNamesWithErrors}`);
      }
  }
};
