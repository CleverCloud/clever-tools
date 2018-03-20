'use strict';

const AppConfig = require('../models/app_configuration.js');
const Domain = require('../models/domain.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const OpenBrowser = require('../open-browser.js');

function open (api, params) {
  const { alias } = params.options;

  const s_open = AppConfig.getAppData(alias)
    .flatMapLatest(({ app_id, org_id }) => {
      return Domain.getBest(api, app_id, org_id);
    })
    .flatMapLatest((vhost) => {
      Logger.println('Opening the application in your browser');
      return OpenBrowser.openPage('http://' + vhost.fqdn);
    });

  handleCommandStream(s_open);
}

module.exports = open;
