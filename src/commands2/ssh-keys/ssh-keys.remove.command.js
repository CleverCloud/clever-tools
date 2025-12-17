import { todo_removeSshKey as removeSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
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

    const keyNameEncoded = encodeURIComponent(keyName);
    await removeSshKey({ key: keyNameEncoded }).then(sendToApi);

    Logger.printSuccess(`SSH key ${keyName} removed successfully`);
  },
});
