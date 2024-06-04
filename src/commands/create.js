'use strict';

const path = require('path');
const Application = require('../models/application.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const Scale = require('../commands/scale.js');

async function create (params) {
  const { type: typeName, 'cancel-on-push': cancelOnPush, 'force-https': forceHttps, 'sticky-sessions': stickySessions } = params.options;
  const { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor } = Scale.validateOptions(params.options, true);

  const [rawName] = params.args;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format, task: taskCommand } = params.options;
  const { apps } = await AppConfig.loadApplicationConf();

  // Application name is optionnal, use current directory name if not specified (empty string)
  const name = (rawName !== '') ? rawName : getCurrentDirectoryName();

  const isTask = (taskCommand != null);
  const envVars = isTask
    ? { CC_RUN_COMMAND: taskCommand }
    : {};

  AppConfig.checkAlreadyLinked(apps, name, alias);

  const github = getGithubDetails(githubOwnerRepo);
  const app = await Application.create(name, typeName, region, minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor, orgaIdOrName, github, isTask, cancelOnPush, forceHttps, stickySessions, envVars);
  await AppConfig.addLinkedApplication(app, alias);

  switch (format) {
    case 'json': {
      Logger.printJson({
        id: app.id,
        name: app.name,
        type: app.instance.type,
        region: app.zone,
        separateBuild: app.separateBuild,
        buildFlavor: app.buildFlavor.name,
        minFlavor: app.instance.minFlavor.name,
        maxFlavor: app.instance.maxFlavor.name,
        minInstances: app.instance.minInstances,
        maxInstances: app.instance.maxInstances,
        executedAs: app.instance.lifetime,
        cancelOnPush: app.cancelOnPush,
        stickySessions: app.stickySessions,
        forceHttps: app.forceHttps,
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
