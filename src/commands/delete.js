'use strict';

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function deleteApp (api, params) {
  const { alias, yes: skipConfirmation } = params.options;

  const s_delete = AppConfig.getAppData(alias)
    .flatMapLatest((app_data) => {
      return Application.deleteApp(api, app_data, skipConfirmation)
        .flatMapLatest(() => Application.unlinkRepo(api, app_data.alias));
    })
    .map(() => Logger.println('The application has been deleted'));

  handleCommandStream(s_delete);
};

module.exports = deleteApp;
