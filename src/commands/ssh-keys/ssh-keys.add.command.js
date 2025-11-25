import { sshKeyNameArg } from './ssh-keys.args.js';
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

export const sshKeysAddCommand = {
  name: 'add',
  description: 'Add a new SSH key to the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    {
      name: 'ssh-key-path',
      description: 'SSH public key path (.pub)',
      parser: null,
      complete: null
    },
    sshKeyNameArg,
  ],
  async execute(params) {
    const [keyName, filePath] = params.args;
    
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
  }
};
