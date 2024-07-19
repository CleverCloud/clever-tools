import { spawn } from 'child_process';

import * as Application from '../models/application.js';
import { conf } from '../models/configuration.js';

export async function ssh (params) {
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
}
