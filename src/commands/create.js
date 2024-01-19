'use strict';

const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function create (params) {
  const { type: typeName } = params.options;
  const [name] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format } = params.options;
  const { apps } = await AppConfig.loadApplicationConf();
  
  AppConfig.checkAlreadyLinked(apps, name, alias);
  
  const github = getGithubDetails(githubOwnerRepo);
  const app = await Application.create(name, typeName, region, orgaIdOrName, github);
  await AppConfig.addLinkedApplication(app, alias);

  switch (format) {

    case 'json': {
      console.log(JSON.stringify(app, null, 2));
      break;
    }

    case 'human':
    default:
      Logger.println('Your application has been successfully created!');
  }
};

function getGithubDetails (githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

module.exports = { create };
