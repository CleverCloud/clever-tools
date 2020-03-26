'use strict';

const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function create (params) {
  const { type: typeName } = params.options;
  const [name] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo } = params.options;
  const github = getGithubDetails(githubOwnerRepo);

  const app = await Application.create(name, typeName, region, orgaIdOrName, github);
  await AppConfig.addLinkedApplication(app, alias).toPromise();

  Logger.println('Your application has been successfully created!');
};

function getGithubDetails (githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

module.exports = { create };
