'use strict';

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function unlink (api, params) {
  const [alias] = params.args;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Application.unlinkRepo(api, appData.alias))
    .map(() => Logger.println('Your application has been successfully unlinked!'));

  handleCommandStream(s_result);
};

module.exports = unlink;
