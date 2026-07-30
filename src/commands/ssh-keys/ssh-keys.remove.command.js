import { DeletePersonalSshKeyCommand } from '@clevercloud/client/cc-api-commands/ssh-key/delete-personal-ssh-key-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';
import { sshKeyNameArg } from './ssh-keys.args.js';

export const sshKeysRemoveCommand = defineCommand({
  description: 'Remove a SSH key from the current user',
  since: '3.13.0',
  options: {},
  args: [sshKeyNameArg],
  async handler(_options, keyName) {
    const keys = await getUserSshKeys();

    if (keys.find((key) => key.name === keyName) == null) {
      throw new Error(`SSH key ${styleText('red', keyName)} not found`);
    }

    await clients.ccApi.send(new DeletePersonalSshKeyCommand({ name: keyName }));

    Logger.printSuccess(`SSH key ${keyName} removed successfully`);
  },
});
