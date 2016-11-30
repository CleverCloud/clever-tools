var _ = require("lodash");
var spawn = require('child_process').spawn;
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Config = require("../models/configuration.js");

var ssh = module.exports = function(api, params) {
  var alias = params.args[0];

  var s_appData = AppConfig.getAppData(alias).toProperty();
  var s_result = s_appData.flatMapLatest(function(app_data) {
    return ssh_process = spawn(
      'ssh',
      ['-t', Config.SSH_GATEWAY, app_data.app_id],
      { stdio: 'inherit' }
    )
  });


  s_result.onValue(function() {});

  s_result.onError(Logger.error);
};
