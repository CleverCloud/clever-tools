import { spawn } from 'node:child_process';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import * as Application from '../../models/application.js';
import { conf } from '../../models/configuration.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const sshCommand = defineCommand({
  description: 'Connect to running instances through SSH',
  since: '0.7.0',
  options: {
    'identity-file': defineOption({
      name: 'identity-file',
      schema: z.string().optional(),
      description: 'SSH identity file',
      aliases: ['i'],
      placeholder: 'identity-file',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, 'identity-file': identityFile } = options;

    const { appId } = await Application.resolveId(appIdOrName, alias);
    const sshParams = ['-t', conf.SSH_GATEWAY, appId];
    if (identityFile != null) {
      sshParams.push('-i', identityFile);
    }

    await new Promise((resolve, reject) => {
      // TODO: we should catch errors
      const sshProcess = spawn('ssh', sshParams, { stdio: 'inherit' });
      sshProcess.on('exit', resolve);
      sshProcess.on('error', reject);
    });
  },
});
