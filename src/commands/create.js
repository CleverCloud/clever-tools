'use strict';

const path = require('path');
const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

async function create (params) {
  const { type: typeName } = params.options;
  const [rawName] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format, task } = params.options;
  const { apps } = await AppConfig.loadApplicationConf();

  // Application name is optionnal, use current directory name if not specified (empty string)
  const name = (rawName !== '') ? rawName : getCurrentDirectoryName();
  // After Node.js 21.7.0, we could use require('node:util').parseEnv(`CC_RUN_COMMAND=${task}`)
  const envVars = task.length > 0 ? { "CC_RUN_COMMAND": task } : {};

  AppConfig.checkAlreadyLinked(apps, name, alias);

  const github = getGithubDetails(githubOwnerRepo);
  const app = await Application.create(name, typeName, region, orgaIdOrName, github, task, envVars);
  await AppConfig.addLinkedApplication(app, alias);

  switch (format) {
    case 'json': {
      Logger.printJson({
        id: app.id,
        name: app.name,
        executedAs: app.instance.lifetime,
        deployUrl: app.deployUrl,
      });
      break;
    }

    case 'human':
    default:
      if (task === null) {
        Logger.println('Your application has been successfully created!')
      } else {
        Logger.println('Your application has been successfully created as a task!')
      }
      Logger.println(`ID: ${app.id}`);
      Logger.println(`Name: ${name}`);
  }
};

function getGithubDetails (githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

function getCurrentDirectoryName () {
  return path.basename(process.cwd());
}

module.exports = { create };
