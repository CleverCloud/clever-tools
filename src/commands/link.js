'use strict';

const Application = require('../models/application.js');
const Logger = require('../logger.js');

async function link (params) {
  const [app] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  if (app.app_id != null && orgaIdOrName != null) {
    Logger.warn('You\'ve specified a unique application ID, organisation option will be ignored');
  }

  await Application.linkRepo(app, orgaIdOrName, alias);

  Logger.println('Your application has been successfully linked!');
}

module.exports = { link };
