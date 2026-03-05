import { getAllInstances } from '@clevercloud/client/esm/api/v2/application.js';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { selectAnswer } from '../../lib/prompts.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
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
    const { appId, ownerId } = await Application.resolveId(appIdOrName, alias);

    const instances = await getAllInstances({ id: ownerId, appId }).then(sendToApi);

    if (instances.length === 0) {
      throw new Error('No running instances found for this application');
    }

    let sshTarget;
    if (instances.length === 1) {
      sshTarget = instances[0].id;
    } else if (process.stdout.isTTY) {
      const choices = instances
        .sort((a, b) => a.instanceNumber - b.instanceNumber)
        .map((inst) => ({
          name: `${inst.displayName} - Instance ${inst.instanceNumber} - ${inst.state} (${inst.id})`,
          value: inst.id,
        }));
      sshTarget = await selectAnswer('Select an instance:', choices);
    } else {
      throw new Error('Multiple instances are running. Cannot select in non-interactive mode.');
    }

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
