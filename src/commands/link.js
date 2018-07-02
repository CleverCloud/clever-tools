'use strict';

const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function link (api, params) {
  const [appIdOrName] = params.args;
  const { org: orgaIdOrName, alias } = params.options;

  if (appIdOrName.app_id && orgaIdOrName) {
    Logger.warn(`You've specified a unique application ID, organisation option will be ignored`);
  }

  const s_linkRepo = Application.linkRepo(api, appIdOrName, orgaIdOrName, alias)
    .map(() => Logger.println('Your application has been successfully linked!'));

  handleCommandStream(s_linkRepo);
}

module.exports = link;
