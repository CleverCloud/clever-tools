import path from 'node:path';
import colors from 'colors/safe.js';
import * as Application from '../models/application.js';
import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';
import { isGitWorkingDirectoryClean, isInsideGitRepo } from '../models/git.js';
import { conf } from '../models/configuration.js';

export async function create (params) {
  const { type: typeName } = params.options;
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
  const app = await Application.create(name, typeName, region, orgaIdOrName, github, isTask, envVars);
  await AppConfig.addLinkedApplication(app, alias);

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
      await displayAppCreation(app, alias, github, taskCommand);
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

/**
 * Display the application creation message in a human-readable format
 * @param {Object} app - The application object
 * @param {string} alias - The alias of the application
 * @param {Object} github - The GitHub details
 * @param {string} taskCommand - The task command
 */
async function displayAppCreation (app, alias, github, taskCommand) {

  Logger.printSuccess(`Application ${colors.green(app.name)} successfully created!`);

  const hasDistinctAlias = alias != null && alias !== app.name;
  const isTask = app.instance.lifetime === 'TASK';

  Logger.println();
  printFieldsAsTable(2, {
    Type: colors.blue(`⬢ ${app.instance.variant.name}`),
    ID: app.id,
    'Org ID': app.ownerId,
    Name: app.name,
    GitHub: github != null && `${github.owner}/${github.name}`,
    Alias: hasDistinctAlias && alias,
    Zone: app.zone,
    Task: isTask && `"${taskCommand}"`,
  });

  Logger.println();
  Logger.println('  ' + colors.bold('Next steps:'));

  if (!github) {
    const isInsideGit = await isInsideGitRepo();
    if (!isInsideGit) {
      Logger.println(`  ${colors.yellow('!')} Initialize a git repository first, for example:`);
      Logger.println(`    ${shellCommand('git init')}`);
      Logger.println(`    ${shellCommand('git add .')}`);
      Logger.println(`    ${shellCommand('git commit -m "Initial commit"')}`);
      Logger.println();
    }
    else {
      const isClean = await isGitWorkingDirectoryClean();
      if (!isClean) {
        Logger.println(`  ${colors.yellow('!')} Commit your changes first:`);
        Logger.println(`    ${shellCommand('git add .')}`);
        Logger.println(`    ${shellCommand('git commit -m "My changes"')}`);
        Logger.println();
      }
    }
  }

  if (github) {
    Logger.println(`  ${colors.blue('→')} Push changes to ${colors.blue(`${github.owner}/${github.name}`)} GitHub repository to trigger a deployment, or ${colors.blue('clever restart')} the latest pushed commit`);
  }
  else {
    Logger.println(`  ${colors.blue('→')} Run ${colors.blue('clever deploy')} ${isTask ? 'to execute your task' : 'to deploy your application'}`);
  }

  Logger.println(`  ${colors.blue('→')} Manage your application at: ${colors.underline(`${conf.GOTO_URL}/${app.id}`)}`);
  Logger.println('');
}

function shellCommand (command) {
  return `${colors.grey('$')} ${colors.yellow(command)}`;
}

function printFieldsAsTable (indent, fields) {
  const fieldsWithValues = Object.fromEntries(Object.entries(fields).filter(([_, value]) => typeof value === 'string'));
  const labelMaxWidth = Math.max(...Object.keys(fieldsWithValues).map((label) => label.length));
  return Object.entries(fieldsWithValues).forEach(([label, value]) => {
    Logger.println(`${' '.repeat(indent)}${label.padEnd(labelMaxWidth, ' ')}  ${colors.grey(value)}`);
  });
}
