import { todo_removeSshKey as removeSshKey } from '@clevercloud/client/esm/api/v2/user.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getUserSshKeys } from '../../models/ssh-keys.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { sshKeyNameArg } from './ssh-keys.args.js';

export const sshKeysRemoveCommand = defineCommand({
  name: 'remove',
  description: 'Remove a SSH key from the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [sshKeyNameArg],
  async execute(params) {
    const [keyName] = params.args;

    const keys = await getUserSshKeys();

    if (keys.find((key) => key.name === keyName) == null) {
      throw new Error(`SSH key ${styleText('red', keyName)} not found`);
    }

    const keyNameEncoded = encodeURIComponent(keyName);
    await removeSshKey({ key: keyNameEncoded }).then(sendToApi);

    Logger.printSuccess(`SSH key ${keyName} removed successfully`);
  },
});
