import { CreatePersonalSshKeyInnerCommand } from '@clevercloud/client/cc-api-commands/ssh-key/create-personal-ssh-key-command.js';
import { isCcHttpError } from '@clevercloud/client/utils/error-utils.js';
import fs from 'node:fs';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { sshKeyNameArg } from './ssh-keys.args.js';

export const sshKeysAddCommand = defineCommand({
  description: 'Add a new SSH key to the current user',
  since: '3.13.0',
  options: {},
  args: [
    sshKeyNameArg,
    defineArgument({
      schema: z.string(),
      description: 'SSH public key path (.pub)',
      placeholder: 'ssh-key-path',
    }),
  ],
  async handler(_options, keyName, filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`);
    }

    const pubKeyContent = fs.readFileSync(filePath, 'utf8').trim();
    Logger.debug(`SSH key file content: ${pubKeyContent}`);

    try {
      await clients.ccApi.send(new CreatePersonalSshKeyInnerCommand({ name: keyName, key: pubKeyContent }));
      Logger.printSuccess(`SSH key ${keyName} added successfully`);
    } catch (e) {
      if (isCcHttpError(e) && e.code === '505') {
        throw new Error("This SSH key is not valid, please make sure you're pointing to the public key file");
      }
      throw e;
    }
  },
});
