import { spawn } from 'node:child_process';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import * as Application from '../../models/application.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const sshCommand = defineCommand({
  description: 'Connect to running instances through SSH',
  since: '0.7.0',
  options: {
    identityFile: defineOption({
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
    const { alias, app: appIdOrName, identityFile } = options;
    const { appId } = await Application.resolveId(appIdOrName, alias);

    const sshTarget = appId;

    const sshParams = [];
    // -t: force PTY allocation (SSH skips it by default because appId is passed as a command for gateway routing)
    sshParams.push('-t');
    if (identityFile != null) {
      sshParams.push('-i', identityFile);
    }
    sshParams.push(config.SSH_GATEWAY, sshTarget);

    return new Promise((resolve, reject) => {
      const sshProcess = spawn('ssh', sshParams, { stdio: 'inherit' });
      sshProcess.on('exit', resolve);
      sshProcess.on('error', reject);
    });
  },
});
