import { todo_removeSshKey as removeSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { confirm } from '../../lib/prompts.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';

export const sshKeysRemoveAllCommand = defineCommand({
  description: 'Remove all SSH keys from the current user',
  since: '3.13.0',
  options: {
    yes: defineOption({
      name: 'yes',
      schema: z.boolean().default(false),
      description: 'Skip confirmation and remove all SSH keys directly',
      aliases: ['y'],
    }),
  },
  args: [],
  async handler(options) {
    if (!options.yes) {
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
  },
});
