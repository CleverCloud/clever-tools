'use strict';

const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function create (api, params) {
  const [name] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo } = params.options;

  let github;
  if (githubOwnerRepo != null) {
    const [owner, name] = params.options.github.split('/');
    github = { owner, name };
  }

  const s_app = Application.getInstanceType(api, params.options.type)
    .flatMapLatest((type) => {
      return Application.create(api, name, type, region, orgaIdOrName, github);
    })
    .flatMapLatest((app) => {
      return Application.linkRepo(api, { app_id: app.id }, null, alias, true);
    })
    .map(() => Logger.println('Your application has been successfully created!'));

  handleCommandStream(s_app);
};

module.exports = create;
