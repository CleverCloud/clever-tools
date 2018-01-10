const _ = require("lodash");
const spawn = require('child_process').spawn;
const Logger = require("../logger.js");

const AppConfig = require("../models/app_configuration.js");
const Config = require("../models/configuration.js");

const ssh = module.exports = (api, params) => {
  const { alias, 'identity-file': identityFile } = params.options
  const s_result = AppConfig.getAppData(alias).flatMapLatest((app_data) => {
    const sshParams = ['-t', Config.SSH_GATEWAY, app_data.app_id]
    if (identityFile != null) {
      sshParams.push("-i", identityFile)
    }
    return spawn('ssh', sshParams, { stdio: 'inherit' })
  });

  s_result.onValue(function() {});
  s_result.onError(Logger.error);
};
