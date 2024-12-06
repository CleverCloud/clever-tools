import path from 'node:path';
import colors from 'colors/safe.js';
import * as Application from '../models/application.js';
import * as AppConfig from '../models/app_configuration.js';
import { Logger } from '../logger.js';
import { isGitRepo, isGitWorkingDirectoryClean } from '../models/git.js';

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
      displayAppCreation(app, alias, github, taskCommand);
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
function displayAppCreation (app, alias, github, taskCommand) {
  const formatField = (label, value, indent = 3) => {
    if (value == null) return;
    Logger.println(`${' '.repeat(indent)} ${colors.bold(label.padEnd(7))} ${colors.grey(value)}`);
  };

  const gitStatus = !github && isGitRepo() && {
    hasRepo: true,
    isClean: isGitWorkingDirectoryClean(),
    getMessage: () => !isGitRepo()
      ? 'Initialize a git repository first, for example:'
      : 'Commit your changes first:',
    getCommands: () => !isGitRepo()
      ? ['git init', 'git add .', 'git commit -m "Initial commit"']
      : ['git add .', 'git commit -m "Initial commit"'],
  };

  const isTask = app.instance.lifetime === 'TASK';
  const fields = [
    ['Type', colors.blue(`⬢ ${app.instance.variant.name}`)],
    ['ID', app.id],
    ['Org ID', app.ownerId],
    ['Name', app.name],
    github && ['GitHub', `${github.owner}/${github.name}`],
    alias && alias !== app.name && ['Alias', alias],
    ['Region', app.zone.toLocaleUpperCase()],
    isTask && ['Task', `"${taskCommand}"`],
  ].filter(Boolean);

  Logger.println(`${colors.green('✓')} ${colors.bold('Application')} ${colors.green(app.name)} ${colors.bold('successfully created!')}`);
  Logger.println('');

  fields.forEach(([label, value]) => formatField(label, value));

  Logger.println('\n   ' + colors.bold('Next steps:'));

  if (gitStatus) {
    Logger.println(`   ${colors.yellow('!')} ${colors.white(gitStatus.getMessage())}`);
    gitStatus.getCommands().forEach((cmd) => {
      Logger.println(`     ${colors.grey('$')} ${colors.yellow(cmd)}`);
    });
    Logger.println('');
  }

  const deployCommand = github ? 'clever restart' : 'clever deploy';
  if (github) {
    Logger.println(`   ${colors.blue('→')} Push changes to ${colors.blue(`${github.owner}/${github.name}`)} GitHub repository to trigger a deployment, or ${colors.blue('clever restart')} the latest pushed commit`);
  }
  else {
    Logger.println(`   ${colors.blue('→')} Run ${colors.blue(deployCommand)} ${isTask ? 'to execute your task' : 'to deploy your application'}`);
  }
  Logger.println(`   ${colors.blue('→')} View your application at: ${colors.underline(`https://console.clever-cloud.com/goto/${app.id}`)}`);
  Logger.println('');
}
