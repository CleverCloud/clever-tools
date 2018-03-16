'use strict';

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function makeDefault (api, params) {
  const [alias] = params.args;

  const s_result = AppConfig.setDefault(alias)
    .map(() => {
      Logger.println('The application ' + alias + ' has been set as default');
    });

  handleCommandStream(s_result);
};

module.exports = makeDefault;
