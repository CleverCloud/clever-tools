import path from 'node:path';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { AVAILABLE_ZONES, listAvailableTypes, listAvailableZones } from '../../models/application.js';
import { Git } from '../../models/git.js';
import { aliasCreationOption, humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

function getGithubDetails(githubOwnerRepo) {
  if (githubOwnerRepo != null) {
    const [owner, name] = githubOwnerRepo.split('/');
    return { owner, name };
  }
}

function getCurrentDirectoryName() {
  return path.basename(process.cwd());
}

async function displayAppCreation(app, alias, github, taskCommand) {
  Logger.printSuccess(`Application ${styleText('green', app.name)} successfully created!`);

  const hasDistinctAlias = alias != null && alias !== app.name;
  const isTask = app.instance.lifetime === 'TASK';

  Logger.println();
  printFieldsAsTable(2, {
    Type: styleText('blue', `⬢ ${app.instance.variant.name}`),
    ID: app.id,
    'Organisation ID': app.ownerId,
    Name: app.name,
    GitHub: github != null && `${github.owner}/${github.name}`,
    Alias: hasDistinctAlias && alias,
    Zone: app.zone,
    Task: isTask && `"${taskCommand}"`,
  });

  Logger.println();
  Logger.println('  ' + styleText('bold', 'Next steps:'));

  if (!github) {
    const git = await Git.get();
    const isInsideGitRepo = await git.isInsideGitRepo();
    if (!isInsideGitRepo) {
      Logger.println(`  ${styleText('yellow', '!')} Initialize a git repository first, for example:`);
      Logger.println(`    ${shellCommand('git init')}`);
      Logger.println(`    ${shellCommand('git add .')}`);
      Logger.println(`    ${shellCommand('git commit -m "Initial commit"')}`);
      Logger.println();
    } else {
      const isClean = await git.isGitWorkingDirectoryClean();
      if (!isClean) {
        Logger.println(`  ${styleText('yellow', '!')} Commit your changes first:`);
        Logger.println(`    ${shellCommand('git add .')}`);
        Logger.println(`    ${shellCommand('git commit -m "My changes"')}`);
        Logger.println();
      }
    }
  }

  if (github) {
    Logger.println(
      `  ${styleText('blue', '→')} Push changes to ${styleText('blue', `${github.owner}/${github.name}`)} GitHub repository to trigger a deployment, or ${styleText('blue', 'clever restart')} the latest pushed commit`,
    );
  } else {
    Logger.println(
      `  ${styleText('blue', '→')} Run ${styleText('blue', 'clever deploy')} ${isTask ? 'to execute your task' : 'to deploy your application'}`,
    );
  }

  Logger.println(
    `  ${styleText('blue', '→')} Manage your application at: ${styleText('underline', `${config.GOTO_URL}/${app.id}`)}`,
  );
  Logger.println('');
}

function shellCommand(command) {
  return `${styleText('grey', '$')} ${styleText('yellow', command)}`;
}

function printFieldsAsTable(indent, fields) {
  const fieldsWithValues = Object.fromEntries(Object.entries(fields).filter(([_, value]) => typeof value === 'string'));
  const labelMaxWidth = Math.max(...Object.keys(fieldsWithValues).map((label) => label.length));
  return Object.entries(fieldsWithValues).forEach(([label, value]) => {
    Logger.println(`${' '.repeat(indent)}${label.padEnd(labelMaxWidth, ' ')}  ${styleText('grey', value)}`);
  });
}

export const createCommand = defineCommand({
  description: 'Create an application',
  since: '0.2.0',
  options: {
    type: defineOption({
      name: 'type',
      schema: z.string(),
      description: 'Instance type',
      aliases: ['t'],
      placeholder: 'instance-type',
      complete: listAvailableTypes,
    }),
    region: defineOption({
      name: 'region',
      schema: z.string().default('par'),
      description: `Region, can be ${AVAILABLE_ZONES.map((name) => `'${name}'`).join(', ')}`,
      aliases: ['r'],
      placeholder: 'zone',
      complete: listAvailableZones,
    }),
    github: defineOption({
      name: 'github',
      schema: z.string().optional(),
      description: 'GitHub application to use for deployments',
      placeholder: 'owner/repo',
    }),
    task: defineOption({
      name: 'task',
      schema: z.string().min(1).optional(),
      description: 'The application launch as a task executing the given command, then stopped',
      aliases: ['T'],
      placeholder: 'command',
    }),
    org: orgaIdOrNameOption,
    alias: aliasCreationOption,
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string().optional(),
      description: 'Application name (current directory name is used if not specified)',
      placeholder: 'app-name',
    }),
  ],
  async handler(options, rawName) {
    const { type: typeName } = options;

    const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format, task: taskCommand } = options;
    const { apps } = await AppConfig.loadApplicationConf();

    // Application name is optionnal, use current directory name if not specified (empty string)
    const name = rawName !== '' ? rawName : getCurrentDirectoryName();

    const isTask = taskCommand != null;
    const envVars = isTask ? { CC_RUN_COMMAND: taskCommand } : {};

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
  },
});
