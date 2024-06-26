'use strict';

const { spawn } = require('child_process');

const Application = require('../models/application.js');
const { conf } = require('../models/configuration.js');

async function ssh (params) {
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

module.exports = { ssh };
