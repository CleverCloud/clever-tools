'use strict';

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function stop (api, params) {
  const { alias } = params.options;

  const s_stoppedApp = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Application.stop(api, appData.app_id, appData.org_id))
    .map(() => Logger.println('App successfully stopped!'));

  handleCommandStream(s_stoppedApp);
}

module.exports = stop;
