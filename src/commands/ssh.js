'use strict';

const { spawn } = require('child_process');

const AppConfig = require('../models/app_configuration.js');
const { conf } = require('../models/configuration.js');
const handleCommandStream = require('../command-stream-handler');

const ssh = module.exports = (api, params) => {
  const { alias, 'identity-file': identityFile } = params.options;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((app_data) => {
      const sshParams = ['-t', conf.SSH_GATEWAY, app_data.app_id];
      if (identityFile != null) {
        sshParams.push('-i', identityFile);
      }
      return spawn('ssh', sshParams, { stdio: 'inherit' });
    });

  handleCommandStream(s_result);
};
