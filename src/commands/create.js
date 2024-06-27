'use strict';

const fs = require('fs');
const path = require('path');

const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const Env = require('../commands/env.js');

async function create (params) {
  const { type: typeName } = params.options;
  const [rawName] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format, task: taskCommand } = params.options;
  const { apps } = await AppConfig.loadApplicationConf();

  // if no env file is provided, we use '.env' as default
  if (params.options.env != null && params.options.env === '') {
    params.options.env = '.env';
  }

  // if an env file is provided and it does not exist, we exit before creating the app
  if (params.options.env != null && !fs.existsSync(path.join(process.cwd(), params.options.env))) {
    Logger.warn(`File ${params.options.env} not found`);
    return;
  }

  // Application name is optionnal, use current directory name if not specified (empty string)
  const name = (rawName !== '') ? rawName : getCurrentDirectoryName();

  const isTask = (taskCommand != null);
  const envVars = isTask
    ? { CC_RUN_COMMAND: taskCommand }
    : {};

  AppConfig.checkAlreadyLinked(apps, name, alias);

  const github = getGithubDetails(githubOwnerRepo);
  const app = await Application.create(name, typeName, region, orgaIdOrName, github, isTask, envVars);
  await AppConfig.addLinkedApplication(app, alias);

  if (params.options.env != null) {
    const envFileContent = fs.readFileSync(path.join(process.cwd(), params.options.env), 'utf8');

    // We use a trick to avoid printing a message after env vars import
    if (format === 'json') {
      const originalLogger = Logger.println;
      Logger.println = function () {};
      await Env.importEnvFromFile(alias || app.name, envFileContent);

      app.env = `env vars imported from ${params.options.env} file`;
      Logger.println = originalLogger;
    }
    else {
      await Env.importEnvFromFile(alias || app.name, envFileContent);
    }
  }

  switch (format) {
    case 'json': {
      Logger.printJson({
        id: app.id,
        name: app.name,
        executedAs: app.instance.lifetime,
        env: app.env,
        deployUrl: app.deployUrl,
      });
      break;
    }

    case 'human':
    default:
      if (isTask) {
        Logger.println('Your application has been successfully created as a task!');
        Logger.println(`The "CC_RUN_COMMAND" environment variable has been set to "${taskCommand}"`);
      }
      else {
        Logger.println('Your application has been successfully created!');
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
