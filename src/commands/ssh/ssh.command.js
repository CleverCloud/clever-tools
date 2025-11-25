import { spawn } from 'node:child_process';
import * as Application from '../../models/application.js';
import { conf } from '../../models/configuration.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const sshCommand = {
  name: 'ssh',
  description: 'Connect to running instances through SSH',
  experimental: false,
  featureFlag: null,
  opts: {
    'identity-file': {
      name: 'identity-file',
      description: 'SSH identity file',
      type: 'option',
      metavar: 'identity-file',
      aliases: ['i'],
      default: null,
      required: null,
      parser: null,
      complete: null,
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, 'identity-file': identityFile } = params.options;

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
};
