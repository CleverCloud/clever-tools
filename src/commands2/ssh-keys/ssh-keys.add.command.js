import { todo_addSshKey as addSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import fs from 'node:fs';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { sshKeyNameArg } from './ssh-keys.args.js';

export const sshKeysAddCommand = defineCommand({
  description: 'Add a new SSH key to the current user',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [
    defineArgument({
      schema: z.string(),
      description: 'SSH public key path (.pub)',
      placeholder: 'ssh-key-path',
    }),
    sshKeyNameArg,
  ],
  async handler(_options, keyName, filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`);
    }

    const pubKeyContent = fs.readFileSync(filePath, 'utf8').trim();
    Logger.debug(`SSH key file content: ${pubKeyContent}`);

    try {
      await addSshKey({ key: encodeURIComponent(keyName) }, JSON.stringify(pubKeyContent)).then(sendToApi);
    } catch (e) {
      console.log(e?.responseBody?.id);
      if (e?.responseBody?.id === 505) {
        throw new Error("This SSH key is not valid, please make sure you're pointing to the public key file");
      }
    }

    Logger.printSuccess(`SSH key ${keyName} added successfully`);
  },
});
