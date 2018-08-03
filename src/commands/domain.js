'use strict';

const _ = require('lodash');

const AppConfig = require('../models/app_configuration.js');
const Domain = require('../models/domain.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function list (api, params) {
  const { alias } = params.options;

  const s_domains = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Domain.list(api, appData.app_id, appData.org_id))
    .map((domains) => {
      return _.forEach(domains, ({ fqdn }) => Logger.println(fqdn));
    });

  handleCommandStream(s_domains);
}

function add (api, params) {
  const [fqdn] = params.args;
  const { alias } = params.options;

  const s_domain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Domain.create(api, fqdn, appData.app_id, appData.org_id))
    .map(() => Logger.println('Your domain has been successfully saved'));

  handleCommandStream(s_domain);
}

function rm (api, params) {
  const [fqdn] = params.args;
  const { alias } = params.options;

  const s_domain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Domain.remove(api, fqdn, appData.app_id, appData.org_id))
    .map(() => Logger.println('Your domain has been successfully removed'));

  handleCommandStream(s_domain);
}

module.exports = { list, add, rm };
