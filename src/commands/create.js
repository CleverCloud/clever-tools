'use strict';

const fs = require('fs');
const path = require('path');

const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Interact = require('../models/interact.js');
const Logger = require('../logger.js');
const Env = require('../commands/env.js');

const { toNameEqualsValueString } = require('@clevercloud/client/cjs/utils/env-vars.js');

async function create (params) {
  const { type: typeName } = params.options;
  const [name] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format } = params.options;
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

  if(fs.existsSync(path.join(process.cwd(), '.env'))) {
    const envFileContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    await Interact.confirm(
      'Theres is a .env file in this directory, do you want to import its content ? [y/n]: ',
      'The content of .env file has not been imported',
      ['yes', 'y', 'YES', 'Y'],
    );

    await Env.importEnvFromFile(alias || app.name, envFileContent);
  }
};

function getGithubDetails (githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

module.exports = { create };
