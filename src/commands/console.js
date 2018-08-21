'use strict';

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler.js');
const Logger = require('../logger.js');
const OpenBrowser = require('../open-browser.js');

function consoleModule (api, params) {
  const { alias } = params.options;
  const s_open = AppConfig.getAppData(alias)
    .flatMapLatest(({ app_id, org_id }) => {
      Logger.println('Opening the console in your browser');

      const path = (org_id != null) ? `organisations/${org_id}` : 'users/me';
      return OpenBrowser.openPage(`https://console.clever-cloud.com/${path}/applications/${app_id}`);
    });

  handleCommandStream(s_open);
}

module.exports = consoleModule;
