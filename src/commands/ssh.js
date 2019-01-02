'use strict';

const { spawn } = require('child_process');

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const { conf } = require('../models/configuration.js');
const handleCommandStream = require('../command-stream-handler');

function ssh (api, params) {
  const { alias, 'identity-file': identityFile } = params.options;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((app_data) => {
      const sshParams = ['-t', conf.SSH_GATEWAY, app_data.app_id];
      if (identityFile != null) {
        sshParams.push('-i', identityFile);
      }

      const s_sshProcess = new Bacon.Bus();
      const sshProcess = spawn('ssh', sshParams, { stdio: 'inherit' });
      sshProcess.on('exit', () => s_sshProcess.end());
      sshProcess.on('error', (e) => s_sshProcess.error(e));

      return s_sshProcess;
    });

  handleCommandStream(s_result);
}

module.exports = ssh;
